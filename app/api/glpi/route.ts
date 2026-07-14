import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const body = await req.json();

    const { apiUrl, appToken, userToken, isMockMode } = body;

    // Help clean trailing slashes from API URL
    const cleanApiUrl = apiUrl ? apiUrl.replace(/\/+$/, "") : "";

    // 1. Connection Testing Action
    if (action === "test") {
      if (isMockMode) {
        // Return simulated success
        return NextResponse.json({
          success: true,
          message: "Conexão simulada estabelecida com sucesso!",
          sessionToken: "mock_session_token_" + Math.random().toString(36).substr(2, 9),
          glpiVersion: "10.0.12 (Simulado)",
        });
      }

      if (!cleanApiUrl || !appToken || !userToken) {
        return NextResponse.json(
          { error: "Os campos URL da API, App-Token e User-Token são obrigatórios para teste real." },
          { status: 400 }
        );
      }

      try {
        const initUrl = `${cleanApiUrl}/initSession`;
        const response = await fetch(initUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "App-Token": appToken,
            "Authorization": `user_token ${userToken}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json(
            {
              success: false,
              error: `O servidor GLPI retornou status ${response.status}: ${errorText || "Credenciais ou URL incorretas"}`,
            },
            { status: response.status }
          );
        }

        const data = await response.json();
        const sessionToken = data.session_token;

        if (!sessionToken) {
          return NextResponse.json(
            { success: false, error: "Sessão iniciada, mas o token de sessão não foi retornado pelo GLPI." },
            { status: 500 }
          );
        }

        // Kill session gracefully to not leave orphaned sessions
        try {
          await fetch(`${cleanApiUrl}/killSession`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "App-Token": appToken,
              "Session-Token": sessionToken,
            },
          });
        } catch (killErr) {
          console.warn("Erro ao encerrar sessão de teste:", killErr);
        }

        return NextResponse.json({
          success: true,
          message: "Conexão com GLPI estabelecida com sucesso!",
          sessionToken,
        });
      } catch (fetchError: any) {
        console.error("Erro ao testar conexão:", fetchError);
        return NextResponse.json(
          {
            success: false,
            error: `Não foi possível alcançar o servidor GLPI. Verifique se a URL está correta e acessível publicamente. Detalhes: ${fetchError.message || fetchError}`,
          },
          { status: 502 }
        );
      }
    }

    // 2. Ticket Submission Action
    if (action === "submit") {
      const { ticketData } = body;

      if (!ticketData || !ticketData.title || !ticketData.content) {
        return NextResponse.json(
          { error: "Título e descrição do chamado são obrigatórios." },
          { status: 400 }
        );
      }

      if (isMockMode || !cleanApiUrl || !appToken || !userToken) {
        // Mock ticket creation response
        const randomId = Math.floor(10000 + Math.random() * 90000);
        return NextResponse.json({
          success: true,
          id: randomId,
          message: "Chamado registrado no modo simulador!",
          ticket: {
            id: randomId,
            title: ticketData.title,
            content: ticketData.content,
            urgency: ticketData.urgency || 3,
            category: ticketData.category || "Geral",
            location: ticketData.location || "Principal",
            status: "new",
            statusLabel: "Novo",
            date: new Date().toISOString(),
          },
        });
      }

      // Real GLPI Submission Flow
      let sessionToken = "";
      try {
        // Step A: Init Session
        const initRes = await fetch(`${cleanApiUrl}/initSession`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "App-Token": appToken,
            "Authorization": `user_token ${userToken}`,
          },
        });

        if (!initRes.ok) {
          const errText = await initRes.text();
          throw new Error(`Falha na autenticação GLPI (Status ${initRes.status}): ${errText}`);
        }

        const initData = await initRes.json();
        sessionToken = initData.session_token;

        if (!sessionToken) {
          throw new Error("Token de sessão do GLPI não recebido.");
        }

        // Step B: Submit Ticket
        // Map category standard string labels to typical IDs or search logic, or use directly
        // Note: Real GLPI requires integer IDs for itilcategories_id. If user set a custom number ID, we pass it, otherwise fallback to standard category ID or default it.
        const categoryId = parseInt(ticketData.category, 10) || 1; 
        const urgencyVal = parseInt(ticketData.urgency, 10) || 3;

        const ticketPayload = {
          input: {
            name: ticketData.title,
            content: ticketData.content,
            urgency: urgencyVal,
            itilcategories_id: categoryId,
            // Custom locations or descriptions if available
            _users_id_requester: ticketData.requesterId || 0,
          },
        };

        const ticketRes = await fetch(`${cleanApiUrl}/Ticket`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "App-Token": appToken,
            "Session-Token": sessionToken,
          },
          body: JSON.stringify(ticketPayload),
        });

        if (!ticketRes.ok) {
          const errText = await ticketRes.text();
          throw new Error(`Falha ao criar chamado no GLPI (Status ${ticketRes.status}): ${errText}`);
        }

        const ticketResult = await ticketRes.json();
        const createdId = ticketResult.id;

        // Step C: Kill Session (best practice)
        try {
          await fetch(`${cleanApiUrl}/killSession`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "App-Token": appToken,
              "Session-Token": sessionToken,
            },
          });
        } catch (killErr) {
          console.warn("Erro ao encerrar sessão pós-chamado:", killErr);
        }

        return NextResponse.json({
          success: true,
          id: createdId,
          message: `Chamado #${createdId} aberto com sucesso no GLPI real!`,
          ticket: {
            id: createdId,
            title: ticketData.title,
            content: ticketData.content,
            urgency: urgencyVal,
            category: ticketData.categoryName || "Hardware/Sistemas",
            location: ticketData.location || "Central",
            status: "new",
            statusLabel: "Novo",
            date: new Date().toISOString(),
          },
        });
      } catch (apiError: any) {
        console.error("Erro na integração real com o GLPI:", apiError);
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao integrar com GLPI: ${apiError.message || apiError}`,
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ error: "Ação de proxy inválida." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro no proxy GLPI:", error);
    return NextResponse.json(
      { error: `Erro no servidor de proxy GLPI: ${error.message || error}` },
      { status: 500 }
    );
  }
}
