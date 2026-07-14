// Memory store for active jobs and historical tickets

export interface LogMessage {
  id: string;
  timestamp: string;
  msg: string;
  nivel: 'INFO' | 'WARNING' | 'ERROR' | 'SYSTEM';
  chamadoIdx?: number;
}

export interface TicketJob {
  id: string;
  status: 'running' | 'done' | 'error' | 'cancelled';
  logs: LogMessage[];
  total: number;
  processed: number;
  clientController?: AbortController;
}

export interface HistoryTicket {
  id: string;
  data: string;
  status: 'OK' | 'ERRO';
  assunto: string;
  cliente: string;
  catalogo: string;
  glpi_id?: string;
  detalhes?: string;
  original_assunto?: string;
  descricao?: string;
  tipo_demanda?: string;
  urgencia?: string;
  nome_usuario?: string;
  email_usuario?: string;
  celular?: string;
  fila?: string;
  arquivo_anexo?: string;
  arquivo_nome_exibicao?: string;
  arquivo_tamanhos?: string;
  resolucao?: string;
  tecnico?: string;
}

// Keep store in global scope to survive Next.js dev server hot reloads
const globalStore = global as unknown as {
  activeJobs: Map<string, TicketJob>;
  ticketHistory: HistoryTicket[];
};

if (!globalStore.activeJobs) {
  globalStore.activeJobs = new Map<string, TicketJob>();
}

if (!globalStore.ticketHistory) {
  globalStore.ticketHistory = [];
}

export const activeJobs = globalStore.activeJobs;
export const ticketHistory = globalStore.ticketHistory;

export function addLog(jobId: string, msg: string, nivel: LogMessage['nivel'] = 'INFO', chamadoIdx?: number) {
  const job = activeJobs.get(jobId);
  if (job) {
    const logMsg: LogMessage = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      msg,
      nivel,
      chamadoIdx,
    };
    job.logs.push(logMsg);
    
    // Call listeners if any (SSE handles this by reading the array length)
    return logMsg;
  }
  return null;
}
