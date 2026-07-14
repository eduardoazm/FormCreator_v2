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
  customClientes: { abreviatura: string; nome_completo: string }[];
  customCatalogos: string[];
  customFilas: { nome: string; filas: string[] }[];
};

if (!globalStore.activeJobs) {
  globalStore.activeJobs = new Map<string, TicketJob>();
}

if (!globalStore.ticketHistory) {
  globalStore.ticketHistory = [];
}

const DEFAULT_CLIENTES = [
  { "abreviatura": "PZL", "nome_completo": "SES-AM - PZL - Policlinica Zeno Lanzini" },
  { "abreviatura": "HPSDAP", "nome_completo": "INDSH - SES-AM - HPSDAP - HPS Dr. Aristoteles Platao" },
  { "abreviatura": "FMT", "nome_completo": "SES-AM - FMT - Fundação de Medicina Tropical" },
  { "abreviatura": "MDND", "nome_completo": "SES-AM - MDND - Maternidade Dona Nazira Daou" },
  { "abreviatura": "HUFM", "nome_completo": "SES-AM - HUFM - Hosp. Universit. Francisca Mendes" },
  { "abreviatura": "MRAB", "nome_completo": "SES-AM - MRAB - Maternidade de Ref Ana Braga" },
  { "abreviatura": "ICAM", "nome_completo": "SES-AM - ICAM - Inst Saude da Crianca do Amazonas" },
  { "abreviatura": "SPA COROADO", "nome_completo": "SES-AM - SPA COROADO" },
  { "abreviatura": "SPA PDC", "nome_completo": "SES-AM - SPA PDC - SPA e Policlinica Dr. Danilo" },
  { "abreviatura": "HPSCZL", "nome_completo": "SES-AM - HPSCZL - HPS da Criança da Zona Leste" },
  { "abreviatura": "FHAM", "nome_completo": "SES-AM - FHAM - Fund Hospitalar Alfredo da Matta" },
  { "abreviatura": "HGM", "nome_completo": "SES-AM - HGM - Hospital Geral de Manacapuru" },
  { "abreviatura": "CAIC MHFG", "nome_completo": "SES-AM - CAIC MHFG - CAIC Maria H Freitas de Goes" },
  { "abreviatura": "PJSB", "nome_completo": "SES-AM - PJSB - Policlinica João dos Santos Braga" },
  { "abreviatura": "CECON", "nome_completo": "SES-AM CECON - Fundação CECON" },
  { "abreviatura": "HPSJLP", "nome_completo": "SES-AM - HPSJLP - HPS Dr Joao Lucio Pereira" },
  { "abreviatura": "SPA SR", "nome_completo": "SES-AM - SPA SR - SPA São Raimundo" },
  { "abreviatura": "SPA ZS", "nome_completo": "SES-AM - SPA ZS - SPA Zona Sul" },
  { "abreviatura": "MASM", "nome_completo": "SES-AM - MASM - Matern Azilda da Silva Marreiro" },
  { "abreviatura": "CAIMI DPL", "nome_completo": "SES-AM - CAIMI DPL - CAIMI Dr. Paulo Lima" },
  { "abreviatura": "SPA PDJL", "nome_completo": "SES-AM - SPA PDJL - SPA e Pol Dr. Jose Lins" },
  { "abreviatura": "FHAJ", "nome_completo": "SES-AM - FHAJ - Fundação Hospital Adriano Jorge" },
  { "abreviatura": "HPSCZO", "nome_completo": "SES-AM - HPSCZO  - HPS da Criança Zona Oeste" },
  { "abreviatura": "HIDF", "nome_completo": "SES-AM - HIDF - Hospital Infantil Dr Fajardo" },
  { "abreviatura": "PC", "nome_completo": "SES-AM - PC - Policlinica Codajas" },
  { "abreviatura": "HPSCZS", "nome_completo": "SES-AM - HPSCZS - HPS da Criança Zona Sul" },
  { "abreviatura": "PGGM", "nome_completo": "SES-AM - PGGM - Policlinica Gov Gilberto Mestrinh" },
  { "abreviatura": "CAIC AM", "nome_completo": "CAIC AM - CAIC Alexandre Montoril" },
  { "abreviatura": "PCF", "nome_completo": "SES-AM - PCF - Policlinica Cardoso Fontes" },
  { "abreviatura": "HPER", "nome_completo": "SES-AM HPER - Hosp Psiquiátrico Eduardo Ribeiro - (CESMAM)" },
  { "abreviatura": "CAIC JCM", "nome_completo": "SES-AM - CAIC JCM - CAIC Jose Carlos Mestrinho" },
  { "abreviatura": "MBM", "nome_completo": "SES-AM - MBM - Maternidade Balbina Mestrinho" },
  { "abreviatura": "HGR", "nome_completo": "SES-AM - HGR - Hospital Geraldo da Rocha" },
  { "abreviatura": "SPA JD", "nome_completo": "SES-AM - SPA JD - Joventina Dias" },
  { "abreviatura": "SPA ELIAMEME", "nome_completo": "SES-AM - SPA ELIAMEME RODRIGUES MADY" },
  { "abreviatura": "PAA", "nome_completo": "SES-AM - PAA - Policlinica Antonio Aleixo" },
  { "abreviatura": "MA", "nome_completo": "SES-AM - MA - Maternidade Alvorada" },
  { "abreviatura": "HCP", "nome_completo": "SES-AM - HCP - Hospital Chapot Prevost" },
  { "abreviatura": "UPAJR", "nome_completo": "SES-AM - UPAJR - UPA Jose Rodrigues" },
  { "abreviatura": "CAIC DJM", "nome_completo": "SES-AM - CAIC DJM - CAIC Dra Josephina de Mello" },
  { "abreviatura": "CAIC EM", "nome_completo": "SES-AM - CAIC EM - CAIC Edson Melo" }
];

const DEFAULT_CATALOGOS = [
  "Sistemas > Infraestrutura » Equipamentos » Estação de Trabalho",
  "Sistemas > Infraestrutura » Equipamentos » Impressora",
  "Sistemas > Infraestrutura » Equipamentos » Monitor",
  "Sistemas > Infraestrutura » Equipamentos » Nobreak",
  "Sistemas > Infraestrutura » Equipamentos » Periféricos",
  "Sistemas > Infraestrutura » Equipamentos » Totem",
  "Sistemas > Infraestrutura » Redes e Conectividades",
  "Sistemas > Produtos » Integrações » Assinatura Digital",
  "Sistemas > Produtos » Integrações » Med.Place",
  "Sistemas > Produtos » Medplace » Treinamento Medplace",
  "Sistemas > Produtos » SX Anesthesia",
  "Sistemas > Produtos » SX Lis VFR » Treinamento Sx LIS",
  "Sistemas > Produtos » SX Sigma » Agenda",
  "Sistemas > Produtos » SX Sigma » Ambulatório",
  "Sistemas > Produtos » SX Sigma » APAC",
  "Sistemas > Produtos » SX Sigma » Atualização de Módulos",
  "Sistemas > Produtos » SX Sigma » BI",
  "Sistemas > Produtos » SX Sigma » Cadastro Gerais",
  "Sistemas > Produtos » SX Sigma » Centro Cirúrgico",
  "Sistemas > Produtos » SX Sigma » Compras",
  "Sistemas > Produtos » SX Sigma » Configurações",
  "Sistemas > Produtos » SX Sigma » Criação de Usuário Sx Sigma",
  "Sistemas > Produtos » SX Sigma » Faturamento SIASUS",
  "Sistemas > Produtos » SX Sigma » Faturamento SIHSUS",
  "Sistemas > Produtos » SX Sigma » Gerador de Documentos",
  "Sistemas > Produtos » SX Sigma » Gerador de Documentos (Edoc)",
  "Sistemas > Produtos » SX Sigma » Instalação SX Sigma",
  "Sistemas > Produtos » SX Sigma » Metas e Indicadores",
  "Sistemas > Produtos » SX Sigma » Painel Gerencial",
  "Sistemas > Produtos » SX Sigma » Painel Paciente",
  "Sistemas > Produtos » SX Sigma » Painel Senha",
  "Sistemas > Produtos » SX Sigma » Portal",
  "Sistemas > Produtos » SX Sigma » Prontuário Ambulatorial",
  "Sistemas > Produtos » SX Sigma » Prontuário Internação",
  "Sistemas > Produtos » SX Sigma » Recepção e Registro",
  "Sistemas > Produtos » SX Sigma » Requisições",
  "Sistemas > Produtos » SX Sigma » Reset de Senha",
  "Sistemas > Produtos » SX Sigma » SADT",
  "Sistemas > Produtos » SX Sigma » Suprimentos",
  "Sistemas > Produtos » SX Sigma » Treinamento Sx Sigma",
  "Sistemas > Produtos » SX Sigma » Vinculação de Usuário Sx Sigma",
  "Sistemas > Suporte Interno » Instalação de Impressoras",
  "Sistemas > Suporte Interno » Instalação de Programas/Aplicativos",
  "Sistemas > Suporte Interno » Ronda diária"
];

const DEFAULT_FILAS = [
  {
    nome: "Salux",
    filas: [
      "Agentes",
      "Área de Inteligência",
      "Atendimento N1",
      "Atendimento N2",
      "Atendimento RN",
      "Atendimento Tocantins",
      "Atendimento UBS",
      "Chamados Globais",
      "Comercial",
      "Customer Success",
      "Desenvolvimento - N3",
      "Equipe Suporte Interno",
      "Financeiro",
      "Gerência",
      "Implantação",
      "Implantação Tocantins",
      "Infraestrutura Manaus",
      "Infraestrutura POA",
      "Infraestrutura SP",
      "Infraestrutura Tocantins",
      "Med.Place",
      "Microinformática Manaus",
      "Microinformática Tocantins",
      "Product Owner",
      "RH",
      "Skymed - Atendimento N2",
      "Skymed - Desenvolvimento N3",
      "Suporte Zenvia-Movidesk",
      "Teste N2",
      "Usuários VIPS",
      "Zerodox"
    ]
  },
  {
    nome: "Salux > Clientes",
    filas: [
      "Atendimento Inter Manaus",
      "Atendimento Manaus",
      "Atendimento UBS- N2",
      "Celula Avançada",
      "Implantação Manaus",
      "RDM - EMERGENCIAL",
      "UBS Manaus"
    ]
  }
];

if (!globalStore.customClientes) {
  globalStore.customClientes = [...DEFAULT_CLIENTES];
}

if (!globalStore.customCatalogos) {
  globalStore.customCatalogos = [...DEFAULT_CATALOGOS];
}

if (!globalStore.customFilas) {
  globalStore.customFilas = JSON.parse(JSON.stringify(DEFAULT_FILAS));
}

export const activeJobs = globalStore.activeJobs;
export const ticketHistory = globalStore.ticketHistory;
export const customClientes = globalStore.customClientes;
export const customCatalogos = globalStore.customCatalogos;
export const customFilas = globalStore.customFilas;

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
