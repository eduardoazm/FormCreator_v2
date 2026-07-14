import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini client with standard user-agent for AI Studio build telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const body = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "A chave de API do Gemini (GEMINI_API_KEY) não está configurada." },
        { status: 500 }
      );
    }

    if (action === "refine") {
      const { title, description } = body;

      if (!title || !description) {
        return NextResponse.json(
          { error: "Título e descrição são obrigatórios para a otimização." },
          { status: 400 }
        );
      }

      const prompt = `Analise a seguinte solicitação de suporte de TI (chamado) e forneça uma versão profissional e estruturada.
Título original: "${title}"
Descrição original: "${description}"

Você deve retornar um objeto JSON contendo:
1. "refinedTitle": Um título claro, profissional e objetivo para o chamado técnico (curto, máx. 10 palavras).
2. "refinedDescription": Uma descrição detalhada em Markdown, estruturada formalmente com as seções: "### 🔍 Sintoma / Problema", "### 💻 Equipamento / Contexto" (se houver), "### ⚡ Impacto no Trabalho" e "### 📝 Passos ou Detalhes Adicionais".
3. "suggestedUrgency": Um número inteiro de 1 a 5, onde:
   - 1: Muito Baixa (Dúvida simples, sem bloqueio)
   - 2: Baixa (Incômodo menor, contorno disponível)
   - 3: Média (Lentidão ou falha parcial que atrapalha o trabalho)
   - 4: Alta (Bloqueio de tarefas essenciais, falha de sistema individual)
   - 5: Muito Alta (Setor inteiro parado, falha crítica geral de servidor)
4. "urgencyJustification": Uma explicação curta em português de por que você recomendou essa urgência.
5. "suggestedCategory": Uma sugestão de categoria técnica padrão (ex: "Sistemas Corporativos", "Acesso/Rede", "Hardware/Periféricos", "Email/Colaboração", "Segurança/Senhas", "Telefonia").`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedTitle: { type: Type.STRING },
              refinedDescription: { type: Type.STRING },
              suggestedUrgency: { type: Type.INTEGER },
              urgencyJustification: { type: Type.STRING },
              suggestedCategory: { type: Type.STRING },
            },
            required: [
              "refinedTitle",
              "refinedDescription",
              "suggestedUrgency",
              "urgencyJustification",
              "suggestedCategory",
            ],
          },
        },
      });

      const responseText = response.text?.trim() || "{}";
      const result = JSON.parse(responseText);
      return NextResponse.json(result);
    }

    if (action === "chat") {
      const { messages, currentTicket } = body;

      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: "Histórico de mensagens é obrigatório para o chat." },
          { status: 400 }
        );
      }

      // Prepare context about the active ticket state if any
      const ticketContext = currentTicket
        ? `\nContexto do chamado que o usuário está preenchendo no momento:\nTítulo atual: "${currentTicket.title || ""}"\nDescrição atual: "${currentTicket.description || ""}"`
        : "";

      const systemInstruction = `Você é o "Assistente de Suporte de TI do Portal GLPI", um especialista em suporte técnico atencioso, empático e focado em solucionar ou triar problemas de usuários.
Seu objetivo é:
1. Ajudar o usuário a resolver o problema rapidamente com dicas de autoatendimento (se aplicável).
2. Se o problema precisar de intervenção técnica, ajude o usuário a estruturar e redigir o chamado da melhor forma.
3. Faça perguntas curtas e diretas para entender a falha (ex: "Ocorre em outros computadores?", "Aparece alguma mensagem de erro específica?").
${ticketContext}

Mantenha as respostas amigáveis, em português brasileiro, curtas, fáceis de ler e organizadas com tópicos simples.`;

      // Formulate the conversational format for Gemini
      // Map frontend message roles to Gemini content parts
      const contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return NextResponse.json({ text: response.text });
    }

    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na rota Gemini API:", error);
    return NextResponse.json(
      { error: `Erro no processamento da IA: ${error.message || error}` },
      { status: 500 }
    );
  }
}
