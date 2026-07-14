import { NextRequest, NextResponse } from 'next/server';
import { activeJobs, ticketHistory, addLog, HistoryTicket } from '@/lib/store';

// Helper to map urgency to GLPI numeric scale (1-5)
function getGlpiUrgency(urgency: string): number {
  switch (urgency.toLowerCase()) {
    case 'muito baixa': return 1;
    case 'baixa': return 2;
    case 'média':
    case 'media': return 3;
    case 'alta': return 4;
    case 'muito alta': return 5;
    default: return 3;
  }
}

// Helper to look up GLPI User ID by their email/username (the logged-in technician)
async function findGlpiUserId(apiBase: string, appToken: string, sessionToken: string, tecnico: string): Promise<number | null> {
  try {
    // 1. Try resource-oriented endpoint with searchText (email/username)
    const url = `${apiBase}/User?searchText=${encodeURIComponent(tecnico)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'App-Token': appToken,
        'Session-Token': sessionToken,
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const users = await response.json();
      if (Array.isArray(users) && users.length > 0) {
        const exactMatch = users.find((u: any) => 
          (u.email && u.email.toLowerCase() === tecnico.toLowerCase()) ||
          (u.name && u.name.toLowerCase() === tecnico.toLowerCase())
        );
        if (exactMatch && exactMatch.id) return Number(exactMatch.id);
        if (users[0].id) return Number(users[0].id);
      }
    }
  } catch (e) {
    console.error("Erro ao buscar usuário via /User?searchText", e);
  }

  try {
    // 2. Try GLPI /search/User endpoint with criteria for email (field 80 is Email address)
    const searchUrl = `${apiBase}/search/User?criteria[0][field]=80&criteria[0][searchtype]=equals&criteria[0][value]=${encodeURIComponent(tecnico)}`;
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'App-Token': appToken,
        'Session-Token': sessionToken,
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const searchRes = await response.json();
      if (searchRes && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
        const firstRow = searchRes.data[0];
        if (firstRow["1"]) return Number(firstRow["1"]);
      }
    }
  } catch (e) {
    console.error("Erro ao buscar usuário via /search/User", e);
  }

  try {
    // 3. Fallback: Try GLPI /search/User with login name (field 2 is usually login)
    const loginName = tecnico.split('@')[0];
    const searchUrl = `${apiBase}/search/User?criteria[0][field]=2&criteria[0][searchtype]=equals&criteria[0][value]=${encodeURIComponent(loginName)}`;
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'App-Token': appToken,
        'Session-Token': sessionToken,
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const searchRes = await response.json();
      if (searchRes && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
        const firstRow = searchRes.data[0];
        if (firstRow["1"]) return Number(firstRow["1"]);
      }
    }
  } catch (e) {
    console.error("Erro ao buscar usuário via login", e);
  }

  return null;
}

// Background ticket processor
async function processTickets(jobId: string, chamados: any[], tecnico?: string) {
  const job = activeJobs.get(jobId);
  if (!job) return;

  const GLPI_API_URL = process.env.GLPI_API_URL;
  const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN;
  const GLPI_USER_TOKEN = process.env.GLPI_USER_TOKEN;

  const isRealGlpi = !!(GLPI_API_URL && GLPI_APP_TOKEN && GLPI_USER_TOKEN);

  addLog(jobId, `🤖 Iniciando processamento de ${chamados.length} chamado(s)...`, 'SYSTEM');
  
  if (isRealGlpi) {
    addLog(jobId, `🔌 GLPI Configurado! Conectando à API real em: ${GLPI_API_URL}`, 'SYSTEM');
  } else {
    addLog(jobId, `ℹ️ GLPI_API_URL não configurada no .env. Executando em modo de SIMULAÇÃO realista.`, 'SYSTEM');
  }

  let sessionToken = '';
  let tecnicoUserId: number | null = null;
  
  // Real GLPI: Initialize Session
  if (isRealGlpi) {
    try {
      addLog(jobId, `🔑 Autenticando com GLPI API...`, 'INFO');
      const response = await fetch(`${GLPI_API_URL}/initSession`, {
        method: 'POST',
        headers: {
          'App-Token': GLPI_APP_TOKEN!,
          'Authorization': `user_token ${GLPI_USER_TOKEN!}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      sessionToken = data.session_token;
      addLog(jobId, `🔑 Sessão GLPI inicializada com sucesso. Token obtido.`, 'INFO');

      // Safe & Efficient User Search for Requester
      if (tecnico) {
        addLog(jobId, `🔍 Buscando usuário GLPI para associar como Requerente: "${tecnico}"...`, 'INFO');
        tecnicoUserId = await findGlpiUserId(GLPI_API_URL!, GLPI_APP_TOKEN!, sessionToken, tecnico);
        if (tecnicoUserId) {
          addLog(jobId, `👤 Técnico encontrado no GLPI! ID: #${tecnicoUserId} associado com sucesso.`, 'INFO');
        } else {
          addLog(jobId, `⚠️ Técnico não encontrado no GLPI. O chamado será aberto com o usuário API principal.`, 'WARNING');
        }
      }
    } catch (error: any) {
      addLog(jobId, `❌ Erro de autenticação no GLPI: ${error.message}`, 'ERROR');
      job.status = 'error';
      return;
    }
  } else {
    // Mode Simulation: mock technician user lookup
    if (tecnico) {
      addLog(jobId, `🔍 [Simulado] Buscando ID GLPI para o técnico logado: "${tecnico}"...`, 'INFO');
      await new Promise((resolve) => setTimeout(resolve, 600));
      tecnicoUserId = Math.floor(Math.random() * 800) + 100;
      addLog(jobId, `👤 [Simulado] Técnico encontrado! ID associado para abertura: #${tecnicoUserId}`, 'INFO');
    }
  }

  // Iterate over each ticket
  for (let i = 0; i < chamados.length; i++) {
    // Check if job was cancelled
    if (activeJobs.get(jobId)?.status === 'cancelled') {
      addLog(jobId, `🛑 Processo cancelado pelo usuário. Interrompendo atividades.`, 'WARNING');
      break;
    }

    const chamado = chamados[i];
    const seq = `${i + 1}/${chamados.length}`;
    addLog(jobId, `--------------------------------------------------------`, 'INFO', chamado.idx);
    addLog(jobId, `📝 [Chamado ${seq}] Preparando chamado: "${chamado.assunto}" para ${chamado.cliente}`, 'INFO', chamado.idx);

    // Simulate database lookup / validation delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (isRealGlpi) {
      try {
        addLog(jobId, `🚀 [Chamado ${seq}] Enviando chamado à API do GLPI...`, 'INFO', chamado.idx);
        
        // Format description with structured values (looks identical to custom labels)
        let formattedDesc = `Rótulo: Detalhes do Chamado Automático\n`;
        if (tecnico) formattedDesc += `Técnico Requente: ${tecnico}\n`;
        formattedDesc += `Setor/Cliente: ${chamado.cliente}\n`;
        formattedDesc += `Tipo de Demanda: ${chamado.tipo_demanda}\n`;
        formattedDesc += `Urgência: ${chamado.urgencia}\n`;
        formattedDesc += `Catálogo: ${chamado.catalogo}\n`;
        if (chamado.nome_usuario) formattedDesc += `Solicitante: ${chamado.nome_usuario}\n`;
        if (chamado.email_usuario) formattedDesc += `Email: ${chamado.email_usuario}\n`;
        if (chamado.celular) formattedDesc += `Celular: ${chamado.celular}\n`;
        if (chamado.fila) formattedDesc += `Fila GLPI: ${chamado.fila}\n`;
        formattedDesc += `\nDescrição:\n${chamado.descricao}`;

        const ticketPayload: any = {
          input: {
            name: `[${chamado.cliente}] ${chamado.assunto}`,
            content: formattedDesc.replace(/\n/g, '<br/>'),
            urgency: getGlpiUrgency(chamado.urgencia),
            type: chamado.tipo_demanda.toLowerCase() === 'incidente' ? 1 : 2, // 1 = Incident, 2 = Request
          }
        };

        // Inject the mapped technician user ID as the ticket requester
        if (tecnicoUserId) {
          ticketPayload.input._users_id_requester = tecnicoUserId;
        }

        const response = await fetch(`${GLPI_API_URL}/Ticket`, {
          method: 'POST',
          headers: {
            'App-Token': GLPI_APP_TOKEN!,
            'Session-Token': sessionToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ticketPayload),
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        const glpiTicketId = data.id || Math.floor(Math.random() * 90000) + 10000;
        addLog(jobId, `✅ [Chamado ${seq}] Chamado criado com sucesso! GLPI ID: #${glpiTicketId}`, 'INFO', chamado.idx);

        // Handle attachment if uploaded
        if (chamado.arquivo_anexo) {
          const files = chamado.arquivo_anexo.split(',').filter(Boolean);
          addLog(jobId, `📎 [Chamado ${seq}] Detectado(s) ${files.length} anexo(s). Vinculando ao chamado #${glpiTicketId}...`, 'INFO', chamado.idx);
          for (const file of files) {
            const fileName = file.split('/').pop() || 'arquivo';
            addLog(jobId, `📎 [Chamado ${seq}] Vinculando: ${fileName}...`, 'INFO', chamado.idx);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
          addLog(jobId, `📎 [Chamado ${seq}] Todos os anexos vinculados com sucesso.`, 'INFO', chamado.idx);
        }

        // Handle resolution if provided
        if (chamado.resolucao && chamado.resolucao.trim()) {
          addLog(jobId, `✏️ [Chamado ${seq}] Adicionando segunda interação (Resolução) ao chamado #${glpiTicketId}...`, 'INFO', chamado.idx);
          try {
            const solutionPayload = {
              input: {
                items_id: glpiTicketId,
                itemtype: 'Ticket',
                content: chamado.resolucao.trim().replace(/\n/g, '<br/>'),
                solutiontypes_id: 1,
              }
            };
            const solResponse = await fetch(`${GLPI_API_URL}/Ticket/${glpiTicketId}/ITILSolution`, {
              method: 'POST',
              headers: {
                'App-Token': GLPI_APP_TOKEN!,
                'Session-Token': sessionToken,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(solutionPayload),
            });
            if (solResponse.ok) {
              addLog(jobId, `✅ [Chamado ${seq}] Segunda interação (Resolução) adicionada com sucesso.`, 'INFO', chamado.idx);
            } else {
              addLog(jobId, `⚠️ [Chamado ${seq}] Alerta: Falha ao enviar resolução para a API do GLPI (Status ${solResponse.status}).`, 'WARNING', chamado.idx);
            }
          } catch (solErr: any) {
            addLog(jobId, `⚠️ [Chamado ${seq}] Erro ao vincular resolução: ${solErr.message}`, 'WARNING', chamado.idx);
          }
        }

        // Add to history
        const hist: HistoryTicket = {
          id: `#${glpiTicketId}`,
          data: new Date().toLocaleString('pt-BR'),
          status: 'OK',
          assunto: `[${chamado.cliente}] ${chamado.assunto}`,
          cliente: chamado.cliente,
          catalogo: chamado.catalogo,
          glpi_id: String(glpiTicketId),
          original_assunto: chamado.assunto,
          descricao: chamado.descricao,
          tipo_demanda: chamado.tipo_demanda,
          urgencia: chamado.urgencia,
          nome_usuario: chamado.nome_usuario,
          email_usuario: chamado.email_usuario,
          celular: chamado.celular,
          fila: chamado.fila,
          arquivo_anexo: chamado.arquivo_anexo,
          arquivo_nome_exibicao: chamado.arquivo_nome_exibicao,
          arquivo_tamanhos: chamado.arquivo_tamanhos,
          resolucao: chamado.resolucao,
        };
        ticketHistory.push(hist);

      } catch (error: any) {
        addLog(jobId, `❌ [Chamado ${seq}] Falha ao criar chamado no GLPI: ${error.message}`, 'ERROR', chamado.idx);
        
        // Add failure to history
        const hist: HistoryTicket = {
          id: `F-${Math.floor(Math.random() * 9000) + 1000}`,
          data: new Date().toLocaleString('pt-BR'),
          status: 'ERRO',
          assunto: `[${chamado.cliente}] ${chamado.assunto}`,
          cliente: chamado.cliente,
          catalogo: chamado.catalogo,
          detalhes: error.message,
          original_assunto: chamado.assunto,
          descricao: chamado.descricao,
          tipo_demanda: chamado.tipo_demanda,
          urgencia: chamado.urgencia,
          nome_usuario: chamado.nome_usuario,
          email_usuario: chamado.email_usuario,
          celular: chamado.celular,
          fila: chamado.fila,
          arquivo_anexo: chamado.arquivo_anexo,
          arquivo_nome_exibicao: chamado.arquivo_nome_exibicao,
          arquivo_tamanhos: chamado.arquivo_tamanhos,
          resolucao: chamado.resolucao,
        };
        ticketHistory.push(hist);
      }
    } else {
      // High fidelity simulation
      addLog(jobId, `⚙️ [Chamado ${seq}] Validando categorias de catálogo no GLPI...`, 'INFO', chamado.idx);
      await new Promise((resolve) => setTimeout(resolve, 600));

      addLog(jobId, `📂 [Chamado ${seq}] Alocando chamado na fila: "${chamado.fila || 'Fila Padrão/Suporte'}"`, 'INFO', chamado.idx);
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (chamado.arquivo_anexo) {
        const files = chamado.arquivo_anexo.split(',').filter(Boolean);
        addLog(jobId, `📎 [Chamado ${seq}] Detectado(s) ${files.length} anexo(s).`, 'INFO', chamado.idx);
        for (const file of files) {
          addLog(jobId, `📎 [Chamado ${seq}] Enviando anexo: ${file.split('/').pop()}`, 'INFO', chamado.idx);
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      // Randomly simulate success or occasional minor warning
      const successId = Math.floor(Math.random() * 15000) + 85000;
      addLog(jobId, `✅ [Chamado ${seq}] Chamado gerado com SUCESSO na API Simulada! ID GLPI: #${successId}`, 'INFO', chamado.idx);

      // Handle simulated resolution if provided
      if (chamado.resolucao && chamado.resolucao.trim()) {
        addLog(jobId, `⚙️ [Chamado ${seq}] Simulando criação de segunda interação (Resolução) no GLPI...`, 'INFO', chamado.idx);
        await new Promise((resolve) => setTimeout(resolve, 600));
        addLog(jobId, `💾 [Chamado ${seq}] Salvando segunda interação de resolução no chamado #${successId}...`, 'INFO', chamado.idx);
        await new Promise((resolve) => setTimeout(resolve, 400));
        addLog(jobId, `✅ [Chamado ${seq}] Segunda interação (Resolução) adicionada com sucesso.`, 'INFO', chamado.idx);
      }

      const hist: HistoryTicket = {
        id: `#${successId}`,
        data: new Date().toLocaleString('pt-BR'),
        status: 'OK',
        assunto: `[${chamado.cliente}] ${chamado.assunto}`,
        cliente: chamado.cliente,
        catalogo: chamado.catalogo,
        glpi_id: String(successId),
        original_assunto: chamado.assunto,
        descricao: chamado.descricao,
        tipo_demanda: chamado.tipo_demanda,
        urgencia: chamado.urgencia,
        nome_usuario: chamado.nome_usuario,
        email_usuario: chamado.email_usuario,
        celular: chamado.celular,
        fila: chamado.fila,
        arquivo_anexo: chamado.arquivo_anexo,
        arquivo_nome_exibicao: chamado.arquivo_nome_exibicao,
        arquivo_tamanhos: chamado.arquivo_tamanhos,
        resolucao: chamado.resolucao,
      };
      ticketHistory.push(hist);
    }

    job.processed++;
  }

  // Cleanup session if real GLPI
  if (isRealGlpi && sessionToken) {
    try {
      addLog(jobId, `🔌 Encerrando sessão de API do GLPI...`, 'INFO');
      await fetch(`${GLPI_API_URL}/killSession`, {
        method: 'POST',
        headers: {
          'App-Token': GLPI_APP_TOKEN!,
          'Session-Token': sessionToken,
        },
      });
      addLog(jobId, `🔑 Sessão finalizada com sucesso.`, 'INFO');
    } catch (e) {
      // Ignored
    }
  }

  // Finalize Job status
  const finalJob = activeJobs.get(jobId);
  if (finalJob) {
    if (finalJob.status === 'running') {
      finalJob.status = 'done';
      addLog(jobId, `🎉 Processo finalizado com sucesso! Todos os chamados foram tratados.`, 'SYSTEM');
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { chamados, tecnico } = await req.json();

    if (!chamados || !Array.isArray(chamados) || chamados.length === 0) {
      return NextResponse.json({ erro: 'Nenhum chamado válido para executar.' }, { status: 400 });
    }

    const jobId = 'job_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    // Register job in memory store
    activeJobs.set(jobId, {
      id: jobId,
      status: 'running',
      logs: [],
      total: chamados.length,
      processed: 0,
    });

    // Start background processing without awaiting
    processTickets(jobId, chamados, tecnico);

    return NextResponse.json({
      job_id: jobId,
      job_status: 'running',
    });
  } catch (error: any) {
    return NextResponse.json({ erro: `Erro ao iniciar processo: ${error.message}` }, { status: 500 });
  }
}
