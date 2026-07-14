'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import RelatorioView from '@/components/RelatorioView';
import { 
  Play, 
  X, 
  Plus, 
  Trash2, 
  ClipboardList, 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  Settings, 
  Copy, 
  Paperclip, 
  FileText, 
  Check, 
  CheckSquare,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Lock,
  Eye,
  EyeOff,
  Key,
  Mail,
  Upload,
  FolderPlus,
  Folder,
  Star,
  MoreVertical,
  AlertCircle,
  ScrollText,
  Terminal,
  Search,
  Users,
  Share2,
  Globe,
  Sparkles,
  Bot,
  Send,
  RefreshCw,
  FileSpreadsheet,
  Table,
  Database
} from 'lucide-react';

interface ChamadoRow {
  idx: number;
  cliente: string;
  tipo_demanda: string;
  urgencia: string;
  catalogo: string;
  assunto: string;
  descricao: string;
  nome_usuario?: string;
  email_usuario?: string;
  celular?: string;
  fila?: string;
  arquivo_anexo?: string;
  arquivo_nome_exibicao?: string;
  arquivo_tamanhos?: string;
  invalidFields?: string[];
  selected?: boolean;
  resolucao?: string;
}

interface TeamKit {
  id: string;
  code: number;
  name: string;
  author: string;
  rows: Array<{
    assunto: string;
    descricao: string;
    tipo_demanda?: string;
    urgencia?: string;
    catalogo?: string;
    cliente?: string;
    fila?: string;
    nome_usuario?: string;
    email_usuario?: string;
    celular?: string;
  }>;
}

interface GLPIUser {
  id: string;
  nome: string;
  email: string;
  celular: string;
  perfil: 'admin' | 'tecnico';
  ativo: boolean;
}

interface Resolution {
  id: string;
  name: string;
  text: string;
  isDefault: boolean;
}

interface HistoryItem {
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
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i]}`;
};

const DEFAULT_FILAS_CATEGORIAS = [
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

function generateUniqueId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export default function Home() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('system');
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [atendimentoOpen, setAtendimentoOpen] = useState(false);
  const [temaOpen, setTemaOpen] = useState(false);
  
  // User profile and authentication
  const [userEmail, setUserEmail] = useState<string>('saluxoxfcecon@gmail.com');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // User Management state
  const [users, setUsers] = useState<GLPIUser[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('glpi_technicians');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      { id: '1', nome: 'Eduardo Azevedo', email: 'eduardo.azm1@gmail.com', celular: '(11) 98765-4321', perfil: 'admin', ativo: true },
      { id: '2', nome: 'Salux Suporte', email: 'saluxoxfcecon@gmail.com', celular: '(11) 99999-8888', perfil: 'tecnico', ativo: true },
      { id: '3', nome: 'Ana Costa', email: 'ana.costa@salux.com.br', celular: '(21) 98888-7777', perfil: 'tecnico', ativo: true },
      { id: '4', nome: 'Bruno Rocha', email: 'bruno.rocha@salux.com.br', celular: '(31) 97777-6666', perfil: 'tecnico', ativo: false }
    ];
  });

  const getLoggedUserRole = useCallback(() => {
    const match = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    return match ? match.perfil : 'admin';
  }, [users, userEmail]);

  const [activeView, setActiveView] = useState<'gerador' | 'usuarios' | 'relatorio' | 'tabelas_apoio'>('gerador');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<GLPIUser | null>(null);

  // Form states
  const [userFormNome, setUserFormNome] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormCelular, setUserFormCelular] = useState('');
  const [userFormPerfil, setUserFormPerfil] = useState<'admin' | 'tecnico'>('tecnico');
  const [userFormAtivo, setUserFormAtivo] = useState(true);
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Mode state: 'ubs' | 'manaus'
  const [atendimento, setAtendimento] = useState<'ubs' | 'manaus'>('manaus');

  // Table state
  const [rows, setRows] = useState<ChamadoRow[]>([]);
  const [nextRowId, setNextRowId] = useState(1);

  // Execution logs
  const [logs, setLogs] = useState<{ id: string; msg: string; nivel: 'info' | 'warning' | 'error' | 'system' }[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'idle' | 'running' | 'done' | 'error' | 'cancelled'>('idle');

  // Specific row execution logs
  const [rowExecutionLogs, setRowExecutionLogs] = useState<Record<number, {
    status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
    logs: { id: string; timestamp: string; msg: string; nivel: 'info' | 'warning' | 'error' | 'system' }[];
  }>>({});
  const [logModalRowIdx, setLogModalRowIdx] = useState<number | null>(null);

  // Modals
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [activeDescRowIdx, setActiveDescRowIdx] = useState<number | null>(null);
  const [descInputValue, setDescInputValue] = useState('');
  const [resInputValue, setResInputValue] = useState('');

  // Gemini AI Refinement States
  const [isRefining, setIsRefining] = useState(false);
  const [refinementResult, setRefinementResult] = useState<{
    refinedTitle?: string;
    refinedDescription?: string;
    suggestedUrgency?: number;
    urgencyJustification?: string;
    suggestedCategory?: string;
  } | null>(null);
  const [refinementError, setRefinementError] = useState<string | null>(null);

  // Gemini AI Chat States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Olá! Sou o Assistente de Suporte de TI do Portal GLPI alimentado por IA Gemini. Como posso ajudar você hoje? Posso diagnosticar problemas técnicos ou ajudar a estruturar um chamado perfeito para a tabela.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadingModalRowIdx, setUploadingModalRowIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [modalUploadError, setModalUploadError] = useState<string | null>(null);
  const [isUploadingInModal, setIsUploadingInModal] = useState(false);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [totalHistory, setTotalHistory] = useState(0);

  const filteredHistoryItems = useMemo(() => {
    // Organize in descending chronological order (newest first)
    const sorted = [...historyItems].sort((a, b) => {
      try {
        const parseDate = (dStr: string) => {
          const [datePart, timePart] = dStr.split(/[,\s]+/);
          const [day, month, year] = datePart.split('/').map(Number);
          if (timePart) {
            const [hour, minute, second] = timePart.split(':').map(Number);
            return new Date(year, month - 1, day, hour, minute, second || 0).getTime();
          }
          return new Date(year, month - 1, day).getTime();
        };
        const dateB = parseDate(b.data);
        const dateA = parseDate(a.data);
        return dateB - dateA;
      } catch (e) {
        return (b.id || '').localeCompare(a.id || '');
      }
    });

    if (!historySearchQuery.trim()) return sorted;
    const query = historySearchQuery.toLowerCase().trim();
    return sorted.filter((item) => {
      const matchId = (item.id || '').toLowerCase().includes(query);
      const matchCliente = (item.cliente || '').toLowerCase().includes(query);
      const matchCatalogo = (item.catalogo || '').toLowerCase().includes(query);
      const matchAssunto = (item.assunto || '').toLowerCase().includes(query);
      const matchDescricao = (item.descricao || '').toLowerCase().includes(query);
      const matchDetalhes = (item.detalhes || '').toLowerCase().includes(query);
      return matchId || matchCliente || matchCatalogo || matchAssunto || matchDescricao || matchDetalhes;
    });
  }, [historyItems, historySearchQuery]);

  // Lists for autocomplete datalists
  const [clientList, setClientList] = useState<{ abreviatura: string; nome_completo: string }[]>([]);
  const [catalogList, setCatalogList] = useState<string[]>([]);

  // Hidden file input for attachment
  const fileInputRef = useRef<HTMLInputElement>(null);
  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingRowIdx, setUploadingRowIdx] = useState<number | null>(null);

  // Kits & Favorites State
  const [kitSidebarOpen, setKitSidebarOpen] = useState(false);
  const [kits, setKits] = useState<Array<{ id: string; name: string; rows: any[] }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('glpi_kits');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Erro ao carregar os kits:', e);
        }
      }
    }
    return [];
  });
  const [favorites, setFavorites] = useState<Array<{ id: string; name: string; row: any }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('glpi_favorites');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Erro ao carregar os favoritos:', e);
        }
      }
    }
    return [];
  });

  const [modalEditKitOpen, setModalEditKitOpen] = useState(false);
  const [activeKitToEdit, setActiveKitToEdit] = useState<any | null>(null);
  const [bulkCliente, setBulkCliente] = useState('');
  const [bulkFila, setBulkFila] = useState('');

  // Kits Equipe State
  const [teamKitsSidebarOpen, setTeamKitsSidebarOpen] = useState(false);
  const [teamKitsSearchQuery, setTeamKitsSearchQuery] = useState('');
  const [modalPublishKitConfirmOpen, setModalPublishKitConfirmOpen] = useState(false);
  const [kitToPublish, setKitToPublish] = useState<any | null>(null);

  const [teamKits, setTeamKits] = useState<TeamKit[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('glpi_team_kits');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Erro ao carregar os kits da equipe:', e);
        }
      }
      // Seed initial team kits if empty
      const initialSeed: TeamKit[] = [
        {
          id: 'team_kit_100',
          code: 100,
          name: 'Kit Configuração de Impressora',
          author: 'suporte.tecnico@empresa.com',
          rows: [
            {
              assunto: 'Configuração de Impressora de Rede',
              descricao: 'Solicito o mapeamento e configuração da impressora multifuncional do setor no meu computador.',
              tipo_demanda: 'Requisição',
              urgencia: 'Média'
            }
          ]
        },
        {
          id: 'team_kit_101',
          code: 101,
          name: 'Kit Atualização de Sistema',
          author: 'coordenacao.ti@empresa.com',
          rows: [
            {
              assunto: 'Instalação e atualização de software homologado',
              descricao: 'Necessito da instalação da última versão estável do software corporativo homologado no meu terminal de trabalho.',
              tipo_demanda: 'Requisição',
              urgencia: 'Média'
            }
          ]
        },
        {
          id: 'team_kit_102',
          code: 102,
          name: 'Kit Reset de Senha',
          author: 'seguranca.informacao@empresa.com',
          rows: [
            {
              assunto: 'Solicitação de reset de senha de acesso',
              descricao: 'Prezado suporte, esqueci minha senha ou meu usuário foi bloqueado devido a tentativas incorretas. Peço por gentileza a redefinição.',
              tipo_demanda: 'Requisição',
              urgencia: 'Alta'
            }
          ]
        }
      ];
      localStorage.setItem('glpi_team_kits', JSON.stringify(initialSeed));
      return initialSeed;
    }
    return [];
  });

  const saveTeamKits = (newTeamKits: TeamKit[]) => {
    setTeamKits(newTeamKits);
    if (typeof window !== 'undefined') {
      localStorage.setItem('glpi_team_kits', JSON.stringify(newTeamKits));
    }
  };

  const handleUpdateKitRowField = (kitId: string, rowIdx: number, field: string, value: any) => {
    const updatedKits = kits.map((k) => {
      if (k.id === kitId) {
        const newRows = k.rows.map((row: any, index: number) => {
          if (index === rowIdx) {
            return { ...row, [field]: value };
          }
          return row;
        });
        
        if (activeKitToEdit && activeKitToEdit.id === kitId) {
          setActiveKitToEdit({ ...k, rows: newRows });
        }
        
        return {
          ...k,
          rows: newRows
        };
      }
      return k;
    });
    
    saveKits(updatedKits);
  };

  const handleBulkUpdateKitRows = (kitId: string, field: 'cliente' | 'fila', value: string) => {
    const updatedKits = kits.map((k) => {
      if (k.id === kitId) {
        const newRows = k.rows.map((row: any) => ({
          ...row,
          [field]: value
        }));
        
        if (activeKitToEdit && activeKitToEdit.id === kitId) {
          setActiveKitToEdit({ ...k, rows: newRows });
        }
        
        return {
          ...k,
          rows: newRows
        };
      }
      return k;
    });
    
    saveKits(updatedKits);
    showToast(`Campos de ${field === 'cliente' ? 'Cliente' : 'Fila'} atualizados para todos os chamados deste Kit.`);
  };

  const handleRenameKit = (kitId: string, newName: string) => {
    const updatedKits = kits.map((k) => {
      if (k.id === kitId) {
        return {
          ...k,
          name: newName
        };
      }
      return k;
    });
    
    if (activeKitToEdit && activeKitToEdit.id === kitId) {
      setActiveKitToEdit({ ...activeKitToEdit, name: newName });
    }
    
    saveKits(updatedKits);
  };

  const handleApplyBulkChanges = () => {
    if (!activeKitToEdit) return;
    let updated = false;
    const updatedKits = kits.map((k) => {
      if (k.id === activeKitToEdit.id) {
        const newRows = k.rows.map((row: any) => {
          const newRow = { ...row };
          if (bulkCliente.trim()) {
            newRow.cliente = bulkCliente.trim().toUpperCase();
            updated = true;
          }
          if (bulkFila.trim()) {
            newRow.fila = bulkFila.trim();
            updated = true;
          }
          return newRow;
        });
        
        setActiveKitToEdit({ ...activeKitToEdit, rows: newRows });
        
        return {
          ...k,
          rows: newRows
        };
      }
      return k;
    });
    
    if (updated) {
      saveKits(updatedKits);
      const parts = [];
      if (bulkCliente.trim()) parts.push(`Cliente para "${bulkCliente.trim().toUpperCase()}"`);
      if (bulkFila.trim()) parts.push(`Fila para "${bulkFila.trim()}"`);
      showToast(`Alterações em lote aplicadas: ${parts.join(' e ')}.`);
    } else {
      showToast('Preencha Cliente em Lote ou Fila em Lote para aplicar.');
    }
  };

  const handlePublishKit = (kit: any) => {
    // Only Assunto and Descricao are published, other fields are kept blank or default
    const sanitizedRows = kit.rows.map((r: any) => ({
      assunto: r.assunto || '',
      descricao: r.descricao || '',
      tipo_demanda: r.tipo_demanda || 'Requisição',
      urgencia: r.urgencia || 'Média',
      catalogo: '',
      cliente: '',
      fila: '',
      nome_usuario: '',
      email_usuario: '',
      celular: '',
    }));

    // Find the max code starting from 100
    const maxCode = teamKits.reduce((max, k) => k.code > max ? k.code : max, 99);
    const nextCode = maxCode + 1;

    const newTeamKit: TeamKit = {
      id: 'team_kit_' + generateUniqueId(),
      code: nextCode,
      name: kit.name,
      author: userEmail,
      rows: sanitizedRows,
    };

    const updatedTeamKits = [...teamKits, newTeamKit];
    saveTeamKits(updatedTeamKits);
    showToast(`Kit "${kit.name}" publicado com sucesso sob o código #${nextCode}!`);
  };

  const handleImportTeamKit = (teamKit: TeamKit) => {
    const newLocalKit = {
      id: generateUniqueId(),
      name: teamKit.name,
      rows: teamKit.rows.map((r) => ({
        ...r,
        idx: generateUniqueId(),
      }))
    };
    
    const updatedKits = [...kits, newLocalKit];
    saveKits(updatedKits);
    showToast(`Kit "${teamKit.name}" importado com sucesso para seus "Kit Chamados"!`);
  };
  
  // Custom modals/popups
  const [modalCreateKitOpen, setModalCreateKitOpen] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  
  const [modalFavoriteNameOpen, setModalFavoriteNameOpen] = useState(false);
  const [newFavoriteName, setNewFavoriteName] = useState('');
  const [activeRowForAction, setActiveRowForAction] = useState<ChamadoRow | null>(null);
  
  const [modalAddRowToKitOpen, setModalAddRowToKitOpen] = useState(false);
  
  const [modalKitsListOpen, setModalKitsListOpen] = useState(false);
  const [modalFavoritesListOpen, setModalFavoritesListOpen] = useState(false);
  const [modalGlobalLogsOpen, setModalGlobalLogsOpen] = useState(false);

  // Popover state for the three-dots menu (...) on each row
  const [popoverRowIdx, setPopoverRowIdx] = useState<number | null>(null);

  // Resolutions State
  const [resolutions, setResolutions] = useState<Resolution[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('glpi_resolutions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Erro ao carregar resoluções:', e);
        }
      }
    }
    return [
      {
        id: 'res-1',
        name: 'Procedimento Técnico Padrão',
        text: 'Procedimento de suporte técnico realizado com sucesso. O serviço foi restabelecido e os testes de funcionamento foram realizados em conjunto com o usuário, que confirmou a resolução do problema.',
        isDefault: true
      },
      {
        id: 'res-2',
        name: 'Orientação ao Usuário',
        text: 'Esclarecimento técnico prestado ao solicitante referente à dúvida de utilização do sistema. Chamado encerrado após confirmação do entendimento.',
        isDefault: false
      }
    ];
  });
  const [modalResolutionsOpen, setModalResolutionsOpen] = useState(false);
  const [resolutionSidebarOpen, setResolutionSidebarOpen] = useState(false);

  const [modalCreateResolutionOpen, setModalCreateResolutionOpen] = useState(false);
  const [modalEditResolutionOpen, setModalEditResolutionOpen] = useState(false);
  const [activeResolutionToEdit, setActiveResolutionToEdit] = useState<Resolution | null>(null);
  const [newResolutionName, setNewResolutionName] = useState('');
  const [newResolutionText, setNewResolutionText] = useState('');

  const saveResolutions = (newRes: Resolution[]) => {
    setResolutions(newRes);
    if (typeof window !== 'undefined') {
      localStorage.setItem('glpi_resolutions', JSON.stringify(newRes));
    }
  };

  const handleCreateResolution = () => {
    if (!newResolutionName.trim()) {
      showToast('Por favor, informe o nome da resolução.');
      return;
    }
    if (!newResolutionText.trim()) {
      showToast('Por favor, digite o texto da resolução.');
      return;
    }
    const newRes: Resolution = {
      id: 'res_' + generateUniqueId(),
      name: newResolutionName.trim(),
      text: newResolutionText.trim(),
      isDefault: resolutions.length === 0,
    };
    const updated = [...resolutions, newRes];
    saveResolutions(updated);
    setNewResolutionName('');
    setNewResolutionText('');
    setModalCreateResolutionOpen(false);
    showToast(`Resolução "${newRes.name}" cadastrada com sucesso.`);
  };

  const handleUpdateResolution = () => {
    if (!activeResolutionToEdit) return;
    if (!newResolutionName.trim()) {
      showToast('Por favor, informe o nome da resolução.');
      return;
    }
    if (!newResolutionText.trim()) {
      showToast('Por favor, digite o texto da resolução.');
      return;
    }
    const updated = resolutions.map((r) => {
      if (r.id === activeResolutionToEdit.id) {
        return {
          ...r,
          name: newResolutionName.trim(),
          text: newResolutionText.trim(),
        };
      }
      return r;
    });
    saveResolutions(updated);
    setActiveResolutionToEdit(null);
    setNewResolutionName('');
    setNewResolutionText('');
    setModalEditResolutionOpen(false);
    showToast('Resolução atualizada com sucesso.');
  };

  const handleDeleteResolution = (id: string, name: string) => {
    const updated = resolutions.filter((r) => r.id !== id);
    if (resolutions.find((r) => r.id === id)?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    saveResolutions(updated);
    showToast(`Resolução "${name}" excluída.`);
  };

  const handleSetDefaultResolution = (id: string) => {
    const updated = resolutions.map((r) => ({
      ...r,
      isDefault: r.id === id,
    }));
    saveResolutions(updated);
    const selected = resolutions.find((r) => r.id === id);
    if (selected) {
      showToast(`Resolução "${selected.name}" definida como padrão.`);
    }
  };

  const saveKits = (newKits: Array<{ id: string; name: string; rows: any[] }>) => {
    setKits(newKits);
    localStorage.setItem('glpi_kits', JSON.stringify(newKits));
  };

  const saveFavorites = (newFavs: Array<{ id: string; name: string; row: any }>) => {
    setFavorites(newFavs);
    localStorage.setItem('glpi_favorites', JSON.stringify(newFavs));
  };

  // Profile default settings states
  const [defaultCliente, setDefaultCliente] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('glpi_profile_cliente') || '';
    }
    return '';
  });
  const [defaultFila, setDefaultFila] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('glpi_profile_fila') || '';
    }
    return '';
  });
  const [modalEditProfileOpen, setModalEditProfileOpen] = useState(false);
  const [tempCliente, setTempCliente] = useState('');
  const [tempFila, setTempFila] = useState('');
  const [tempClienteOpen, setTempClienteOpen] = useState(false);
  const [tempFilaOpen, setTempFilaOpen] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchFila, setSearchFila] = useState('');

  // States for Reference Tables (Tabelas de Apoio)
  const [filasCategorias, setFilasCategorias] = useState<{ nome: string; filas: string[] }[]>(DEFAULT_FILAS_CATEGORIAS);
  const [modalReferenceTablesOpen, setModalReferenceTablesOpen] = useState(false);
  const [refTableActiveTab, setRefTableActiveTab] = useState<'clientes' | 'catalogos' | 'filas'>('clientes');
  const [refTableSearchQuery, setRefTableSearchQuery] = useState('');
  const [lastFocusedRowIdx, setLastFocusedRowIdx] = useState<number | null>(null);

  // States for registering reference items
  const [newClientAbrev, setNewClientAbrev] = useState('');
  const [newClientNome, setNewClientNome] = useState('');
  const [newCatalogNome, setNewCatalogNome] = useState('');
  const [newFilaCategoria, setNewFilaCategoria] = useState('Salux');
  const [newFilaCategoriaCustom, setNewFilaCategoriaCustom] = useState('');
  const [newFilaNome, setNewFilaNome] = useState('');
  const [submittingRefTable, setSubmittingRefTable] = useState(false);

  // States for Inline custom autocomplete dropdowns in the table rows
  const [activeRowAutocomplete, setActiveRowAutocomplete] = useState<number | null>(null);
  const [activeFieldAutocomplete, setActiveFieldAutocomplete] = useState<'cliente' | 'catalogo' | 'fila' | null>(null);
  const [searchAutocompleteText, setSearchAutocompleteText] = useState('');

  const openEditProfile = () => {
    setTempCliente(defaultCliente);
    setTempFila(defaultFila);
    const matchCli = clientList.find(c => c.nome_completo === defaultCliente);
    setSearchCliente(matchCli ? `${matchCli.abreviatura} — ${matchCli.nome_completo}` : defaultCliente);
    setSearchFila(defaultFila);
    setTempClienteOpen(false);
    setTempFilaOpen(false);
    setModalEditProfileOpen(true);
  };

  const handleSaveProfile = () => {
    let finalCliente = tempCliente;
    let finalFila = tempFila;

    // Auto-resolve cliente if typed text matches abbreviation or complete name
    if (searchCliente.trim() === '') {
      finalCliente = '';
    } else {
      const matched = clientList.find(c => 
        c.abreviatura.toLowerCase() === searchCliente.toLowerCase().trim() ||
        c.nome_completo.toLowerCase() === searchCliente.toLowerCase().trim() ||
        `${c.abreviatura} — ${c.nome_completo}`.toLowerCase() === searchCliente.toLowerCase().trim()
      );
      if (matched) {
        finalCliente = matched.nome_completo;
      }
    }

    // Auto-resolve fila if typed text matches
    if (searchFila.trim() === '') {
      finalFila = '';
    } else {
      let foundFila = '';
      for (const cat of filasCategorias) {
        const matched = cat.filas.find(f => f.toLowerCase() === searchFila.toLowerCase().trim());
        if (matched) {
          foundFila = matched;
          break;
        }
      }
      if (foundFila) {
        finalFila = foundFila;
      }
    }

    setDefaultCliente(finalCliente);
    setDefaultFila(finalFila);
    localStorage.setItem('glpi_profile_cliente', finalCliente);
    localStorage.setItem('glpi_profile_fila', finalFila);
    setModalEditProfileOpen(false);
    showToast('Configurações de perfil salvas com sucesso.');
  };

  // User Management CRUD Actions
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserFormNome('');
    setUserFormEmail('');
    setUserFormCelular('');
    setUserFormPerfil('tecnico');
    setUserFormAtivo(true);
    setUserFormErrors({});
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: GLPIUser) => {
    setEditingUser(user);
    setUserFormNome(user.nome);
    setUserFormEmail(user.email);
    setUserFormCelular(user.celular);
    setUserFormPerfil(user.perfil);
    setUserFormAtivo(user.ativo);
    setUserFormErrors({});
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    if (!userFormNome.trim()) {
      errors.nome = 'Nome é obrigatório.';
    } else if (userFormNome.trim().length < 3) {
      errors.nome = 'O nome deve ter pelo menos 3 caracteres.';
    }
    
    if (!userFormEmail.trim()) {
      errors.email = 'E-mail é obrigatório.';
    } else if (!userFormEmail.includes('@') || !userFormEmail.includes('.')) {
      errors.email = 'Insira um formato de e-mail válido.';
    } else {
      const isDuplicate = users.some(u => 
        u.email.toLowerCase() === userFormEmail.trim().toLowerCase() && 
        (!editingUser || u.id !== editingUser.id)
      );
      if (isDuplicate) {
        errors.email = 'Este e-mail já está cadastrado para outro técnico.';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setUserFormErrors(errors);
      return;
    }
    
    if (editingUser) {
      const updated = users.map(u => 
        u.id === editingUser.id 
          ? { ...u, nome: userFormNome.trim(), email: userFormEmail.trim(), celular: userFormCelular.trim(), perfil: userFormPerfil, ativo: userFormAtivo }
          : u
      );
      setUsers(updated);
      localStorage.setItem('glpi_technicians', JSON.stringify(updated));
      showToast(`Técnico "${userFormNome.trim()}" atualizado com sucesso!`);
    } else {
      const newUser: GLPIUser = {
        id: generateUniqueId(),
        nome: userFormNome.trim(),
        email: userFormEmail.trim(),
        celular: userFormCelular.trim(),
        perfil: userFormPerfil,
        ativo: userFormAtivo
      };
      const updated = [...users, newUser];
      setUsers(updated);
      localStorage.setItem('glpi_technicians', JSON.stringify(updated));
      showToast(`Técnico "${userFormNome.trim()}" cadastrado com sucesso!`);
    }
    
    setUserModalOpen(false);
  };

  const handleDeleteUser = (user: GLPIUser) => {
    if (user.email.toLowerCase() === userEmail.toLowerCase()) {
      showToast('Erro: Você não pode excluir seu próprio usuário logado.');
      return;
    }
    
    showConfirm(
      'Excluir Técnico',
      `Deseja realmente excluir o técnico "${user.nome}"? Esta ação não poderá ser desfeita.`,
      () => {
        const updated = users.filter(u => u.id !== user.id);
        setUsers(updated);
        localStorage.setItem('glpi_technicians', JSON.stringify(updated));
        showToast(`Técnico "${user.nome}" excluído com sucesso.`);
      }
    );
  };

  const handleToggleUserStatus = (user: GLPIUser) => {
    const updated = users.map(u => 
      u.id === user.id ? { ...u, ativo: !u.ativo } : u
    );
    setUsers(updated);
    localStorage.setItem('glpi_technicians', JSON.stringify(updated));
    showToast(`Status do técnico "${user.nome}" alterado para ${!user.ativo ? 'Ativo' : 'Inativo'}.`);
  };

  // Custom confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  const [confirmCancelAction, setConfirmCancelAction] = useState<(() => void) | null>(null);
  const [confirmOkLabel, setConfirmOkLabel] = useState('Confirmar');
  const [confirmCancelLabel, setConfirmCancelLabel] = useState('Cancelar');

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    okLabel = 'Confirmar',
    cancelLabel = 'Cancelar'
  ) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmAction(() => onConfirm);
    setConfirmCancelAction(() => onCancel || null);
    setConfirmOkLabel(okLabel);
    setConfirmCancelLabel(cancelLabel);
    setConfirmOpen(true);
  };

  // Toasts
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // SSE stream
  const sseRef = useRef<EventSource | null>(null);
  const logBoxRef = useRef<HTMLDivElement>(null);
  const successfulRowIndicesRef = useRef<Set<number>>(new Set());

  // ── Helper Definitions (Moved up to prevent hoisting error) ──────────────
  const resetWithEmptyRows = useCallback(() => {
    const defaultRows: ChamadoRow[] = [
      { idx: 1, cliente: defaultCliente || '', tipo_demanda: 'Requisição', urgencia: 'Média', catalogo: '', assunto: '', descricao: '', fila: defaultFila || '', invalidFields: [] },
      { idx: 2, cliente: defaultCliente || '', tipo_demanda: 'Requisição', urgencia: 'Média', catalogo: '', assunto: '', descricao: '', fila: defaultFila || '', invalidFields: [] },
      { idx: 3, cliente: defaultCliente || '', tipo_demanda: 'Requisição', urgencia: 'Média', catalogo: '', assunto: '', descricao: '', fila: defaultFila || '', invalidFields: [] },
    ];
    setRows(defaultRows);
    setNextRowId(4);
  }, [defaultCliente, defaultFila]);

  const updateHistoryCount = () => {
    fetch('/api/historico')
      .then((r) => r.json())
      .then((data) => setTotalHistory(data.length || 0))
      .catch(() => {});
  };

  // ── Initial Theme, Auth & Lists Setup ─────────────────────────────────────
  useEffect(() => {
    // Restore theme from localStorage
    const savedTheme = localStorage.getItem('glpi_theme') as 'dark' | 'light' | 'system';
    if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
      setTimeout(() => {
        setTheme(savedTheme);
      }, 0);
    } else {
      setTimeout(() => {
        setTheme('system');
      }, 0);
    }

    // Restore session/authentication from localStorage
    const savedEmail = localStorage.getItem('glpi_user_email');
    const savedSession = localStorage.getItem('glpi_logged_in');
    setTimeout(() => {
      if (savedSession === 'true' && savedEmail) {
        setUserEmail(savedEmail);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
      setCheckingAuth(false);
    }, 0);

    // Load initial ticket history count
    updateHistoryCount();
  }, []);

  const refreshStaticLists = useCallback(() => {
    fetch('/api/clientes/buscar?q=')
      .then((r) => r.json())
      .then((data) => setClientList(data.clientes || []))
      .catch((e) => console.warn('Erro ao carregar clientes:', e));

    fetch('/api/catalogos/buscar?q=')
      .then((r) => r.json())
      .then((data) => setCatalogList((data.catalogos || []).map((x: any) => x.nome)))
      .catch((e) => console.warn('Erro ao carregar catálogo:', e));

    fetch('/api/filas')
      .then((r) => r.json())
      .then((data) => setFilasCategorias(data.categorias || []))
      .catch((e) => console.warn('Erro ao carregar filas:', e));
  }, []);

  // Trigger loading list values when auth resolves
  useEffect(() => {
    if (isLoggedIn) {
      refreshStaticLists();
    }
  }, [isLoggedIn, refreshStaticLists]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientAbrev.trim() || !newClientNome.trim()) {
      showToast('Abreviatura e nome completo são obrigatórios!');
      return;
    }
    setSubmittingRefTable(true);
    try {
      const res = await fetch('/api/clientes/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abreviatura: newClientAbrev.trim(),
          nome_completo: newClientNome.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao cadastrar cliente.');
      } else {
        showToast('Cliente cadastrado com sucesso!');
        setNewClientAbrev('');
        setNewClientNome('');
        refreshStaticLists();
      }
    } catch (err) {
      showToast('Erro de rede ao cadastrar cliente.');
    } finally {
      setSubmittingRefTable(false);
    }
  };

  const handleAddCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatalogNome.trim()) {
      showToast('Nome do serviço é obrigatório!');
      return;
    }
    setSubmittingRefTable(true);
    try {
      const res = await fetch('/api/catalogos/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: newCatalogNome.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao cadastrar item de catálogo.');
      } else {
        showToast('Item de catálogo cadastrado com sucesso!');
        setNewCatalogNome('');
        refreshStaticLists();
      }
    } catch (err) {
      showToast('Erro de rede ao cadastrar catálogo.');
    } finally {
      setSubmittingRefTable(false);
    }
  };

  const handleAddFila = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = newFilaCategoria === 'custom' ? newFilaCategoriaCustom : newFilaCategoria;
    if (!finalCategory.trim() || !newFilaNome.trim()) {
      showToast('Categoria e Nome da Fila são obrigatórios!');
      return;
    }
    setSubmittingRefTable(true);
    try {
      const res = await fetch('/api/filas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria: finalCategory.trim(),
          fila: newFilaNome.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao cadastrar fila.');
      } else {
        showToast('Fila de atendimento cadastrada com sucesso!');
        setNewFilaNome('');
        if (newFilaCategoria === 'custom') {
          setNewFilaCategoria(finalCategory.trim());
          setNewFilaCategoriaCustom('');
        }
        refreshStaticLists();
      }
    } catch (err) {
      showToast('Erro de rede ao cadastrar fila.');
    } finally {
      setSubmittingRefTable(false);
    }
  };

  // Sync theme attribute dynamically including system preferences
  useEffect(() => {
    const applyTheme = () => {
      let resolvedTheme: 'dark' | 'light' = 'dark';
      if (theme === 'system') {
        if (typeof window !== 'undefined') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
      } else {
        resolvedTheme = theme;
      }
      document.body.setAttribute('data-theme', resolvedTheme);
    };

    applyTheme();

    if (theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // ── Draft (localStorage) Restore ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || !userEmail) return;
    const draftKey = `glpi_rascunho_${userEmail}_${atendimento}`;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Map to rows with secure indices
          const loadedRows = parsed.map((item: any, i: number) => ({
            ...item,
            idx: i + 1,
            invalidFields: [],
          }));
          setTimeout(() => {
            setRows(loadedRows);
            setNextRowId(loadedRows.length + 1);
          }, 0);
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao restaurar rascunho:', e);
    }

    // Default: 3 blank rows if no draft is present
    setTimeout(() => {
      resetWithEmptyRows();
    }, 0);
  }, [atendimento, isLoggedIn, userEmail, resetWithEmptyRows]);

  // Save Draft (debounced)
  useEffect(() => {
    if (!isLoggedIn || !userEmail || rows.length === 0) return;
    const timer = setTimeout(() => {
      const draftKey = `glpi_rascunho_${userEmail}_${atendimento}`;
      try {
        localStorage.setItem(draftKey, JSON.stringify(rows));
      } catch (e) {}
    }, 600);

    return () => clearTimeout(timer);
  }, [rows, atendimento, isLoggedIn, userEmail]);


  // ── Toast Utility ────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  // ── Options Lists ────────────────────────────────────────────────────────
  const TIPOS = ['Requisição', 'Incidente', 'Melhoria'];
  const URGENCIAS = atendimento === 'ubs'
    ? ['Muito Baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta']
    : ['Baixa', 'Média', 'Alta', 'Muito Alta'];

  // ── Row Actions ──────────────────────────────────────────────────────────
  const addRow = (initialData?: Partial<ChamadoRow>) => {
    const newIdx = nextRowId;
    const newRow: ChamadoRow = {
      idx: newIdx,
      cliente: initialData?.cliente !== undefined ? initialData.cliente : (defaultCliente || ''),
      tipo_demanda: initialData?.tipo_demanda || 'Requisição',
      urgencia: initialData?.urgencia || 'Média',
      catalogo: initialData?.catalogo || '',
      assunto: initialData?.assunto || '',
      descricao: initialData?.descricao || '',
      nome_usuario: initialData?.nome_usuario || '',
      email_usuario: initialData?.email_usuario || '',
      celular: initialData?.celular || '',
      fila: initialData?.fila !== undefined ? initialData.fila : (defaultFila || ''),
      arquivo_anexo: initialData?.arquivo_anexo || '',
      arquivo_nome_exibicao: initialData?.arquivo_nome_exibicao || '',
      arquivo_tamanhos: initialData?.arquivo_tamanhos || '',
      invalidFields: [],
    };
    
    // Clear logs for the new index
    setRowExecutionLogs((prev) => {
      const next = { ...prev };
      delete next[newIdx];
      return next;
    });

    setRows([...rows, newRow]);
    setNextRowId(newIdx + 1);
  };

  const removeRow = (idx: number) => {
    if (rows.length <= 1) {
      showToast('A tabela precisa de no mínimo 1 linha.');
      return;
    }
    setRows(rows.filter((r) => r.idx !== idx));
  };

  const duplicateRow = (idx: number) => {
    const target = rows.find((r) => r.idx === idx);
    if (!target) return;
    
    const newIdx = nextRowId;
    const duplicated: ChamadoRow = {
      ...target,
      idx: newIdx,
      invalidFields: [],
    };

    // Clear logs for the new index
    setRowExecutionLogs((prev) => {
      const next = { ...prev };
      delete next[newIdx];
      return next;
    });

    // Insert immediately below the duplicated row
    const targetIndex = rows.findIndex((r) => r.idx === idx);
    const updatedRows = [...rows];
    updatedRows.splice(targetIndex + 1, 0, duplicated);
    
    setRows(updatedRows);
    setNextRowId(newIdx + 1);
    showToast('Linha duplicada.');
  };

  const updateRowFields = (idx: number, fields: Partial<ChamadoRow>) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.idx === idx) {
          const updated = { ...row, ...fields };
          if (updated.invalidFields) {
            updated.invalidFields = updated.invalidFields.filter((f) => !(f in fields));
          }
          return updated;
        }
        return row;
      })
    );
  };

  const updateRowField = (idx: number, field: keyof ChamadoRow, value: any) => {
    updateRowFields(idx, { [field]: value });
  };

  const toggleRowSelection = (idx: number) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.idx === idx) {
          return { ...row, selected: row.selected === false ? true : false };
        }
        return row;
      })
    );
  };

  const handleClienteChange = (idx: number, val: string) => {
    updateRowField(idx, 'cliente', val);
  };

  const handleClienteBlur = (idx: number, val: string) => {
    const typed = val.trim().toUpperCase();
    const match = clientList.find((c) => c.abreviatura.toUpperCase() === typed);
    if (match) {
      updateRowField(idx, 'cliente', match.nome_completo);
    }
  };

  const loadKitAction = (kit: any, append: boolean) => {
    let startIdx = 1;
    let updatedRows: ChamadoRow[] = [];
    
    if (append) {
      startIdx = nextRowId;
      updatedRows = [...rows];
    }
    
    const kitRowsWithNewIndices = kit.rows.map((r: any, i: number) => {
      return {
        ...r,
        idx: startIdx + i,
        invalidFields: []
      };
    });
    
    // Clear logs for the new indices in rowExecutionLogs
    setRowExecutionLogs((prev) => {
      const next = { ...prev };
      kitRowsWithNewIndices.forEach((r: any) => {
        delete next[r.idx];
      });
      return next;
    });

    const finalRows = [...updatedRows, ...kitRowsWithNewIndices];
    setRows(finalRows);
    setNextRowId(startIdx + kit.rows.length);
    showToast(`Kit "${kit.name}" carregado com sucesso (${kit.rows.length} chamados).`);
  };

  const handleLoadKit = (kit: any) => {
    showConfirm(
      'Carregar Kit',
      `Deseja ADICIONAR os chamados do kit "${kit.name}" ao final das linhas atuais ou SUBSTITUIR as linhas atuais?`,
      () => loadKitAction(kit, true),
      () => loadKitAction(kit, false),
      'Adicionar ao Final',
      'Substituir Linhas'
    );
  };

  const handleCreateKit = (name: string) => {
    if (!name.trim()) return;
    const newKit = {
      id: generateUniqueId(),
      name: name.trim(),
      rows: []
    };
    saveKits([...kits, newKit]);
    setModalCreateKitOpen(false);
    setNewKitName('');
    showToast(`Kit "${newKit.name}" cadastrado com sucesso!`);
  };

  const handleAddRowToKit = (kitId: string) => {
    if (!activeRowForAction) return;
    const kit = kits.find((k) => k.id === kitId);
    if (!kit) return;
    
    const updatedKits = kits.map((k) => {
      if (k.id === kitId) {
        return {
          ...k,
          rows: [...k.rows, { ...activeRowForAction }]
        };
      }
      return k;
    });
    
    saveKits(updatedKits);
    setModalAddRowToKitOpen(false);
    showToast(`Chamado adicionado ao kit "${kit.name}"!`);
  };

  const handleDeleteRowFromKit = (kitId: string, rowIdx: number) => {
    const updatedKits = kits.map((k) => {
      if (k.id === kitId) {
        const newRows = k.rows.filter((_: any, index: number) => index !== rowIdx);
        
        if (activeKitToEdit && activeKitToEdit.id === kitId) {
          setActiveKitToEdit({ ...k, rows: newRows });
        }
        
        return {
          ...k,
          rows: newRows
        };
      }
      return k;
    });
    
    saveKits(updatedKits);
    showToast('Chamado removido do kit.');
  };

  const handleCreateFavorite = (name: string) => {
    if (!name.trim() || !activeRowForAction) return;
    const newFav = {
      id: generateUniqueId(),
      name: name.trim(),
      row: { ...activeRowForAction }
    };
    saveFavorites([...favorites, newFav]);
    setModalFavoriteNameOpen(false);
    setNewFavoriteName('');
    showToast(`Chamado "${newFav.name}" adicionado aos favoritos!`);
  };

  const handleLoadFavorite = (fav: any) => {
    const startIdx = nextRowId;
    const newRow = {
      ...fav.row,
      idx: startIdx,
      invalidFields: []
    };
    setRows([...rows, newRow]);
    setNextRowId(startIdx + 1);
    showToast(`Favorito "${fav.name}" inserido como nova linha.`);
  };

  const handleLimparTabela = () => {
    showConfirm(
      'Limpar Tabela',
      'Deseja realmente apagar todas as linhas da tabela? Esta ação não pode ser desfeita.',
      () => {
        const draftKey = `glpi_rascunho_${userEmail}_${atendimento}`;
        localStorage.removeItem(draftKey);
        
        const initialRow: ChamadoRow = {
          idx: 1,
          cliente: '',
          tipo_demanda: 'Requisição',
          urgencia: 'Média',
          catalogo: '',
          assunto: '',
          descricao: '',
          nome_usuario: '',
          email_usuario: '',
          celular: '',
          fila: '',
          arquivo_anexo: '',
          arquivo_nome_exibicao: '',
          arquivo_tamanhos: '',
          invalidFields: [],
        };
        
        setRows([initialRow]);
        setNextRowId(2);
        showToast('Tabela limpa com sucesso.');
      }
    );
  };

  // ── Excel Copy/Paste Feature ─────────────────────────────────────────────
  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\t') && !text.includes('\n')) return;
    e.preventDefault();

    const lines = text.trim().split('\n').filter((l) => l.trim());
    const firstLine = lines[0].toLowerCase();
    
    // Ignore header line if matching typical excel exports
    const startIdx = (firstLine.includes('cliente') || firstLine.includes('assunto') || firstLine.includes('catálogo')) ? 1 : 0;
    
    let addedCount = 0;
    const pastedRows: ChamadoRow[] = [];
    let currentId = nextRowId;

    lines.slice(startIdx).forEach((line) => {
      const cols = line.split('\t');
      if (cols.length === 0 || !cols[0]) return;

      const newRow: ChamadoRow = {
        idx: currentId,
        cliente: cols[0]?.trim() || '',
        tipo_demanda: cols[1]?.trim() || 'Requisição',
        urgencia: cols[2]?.trim() || 'Média',
        catalogo: cols[3]?.trim() || '',
        assunto: cols[4]?.trim() || '',
        descricao: (cols[5] || '').replace(/\|/g, '\n').trim(),
        fila: cols[6]?.trim() || '',
        nome_usuario: cols[7]?.trim() || '',
        email_usuario: cols[8]?.trim() || '',
        celular: cols[9]?.trim() || '',
        invalidFields: [],
      };
      pastedRows.push(newRow);
      currentId++;
      addedCount++;
    });

    if (pastedRows.length > 0) {
      setRows([...rows, ...pastedRows]);
      setNextRowId(currentId);
      showToast(`${addedCount} linha(s) colada(s) do Excel.`);
    }
  };

  // ── File Upload Handlers ──────────────────────────────────────────────────
  const triggerRowUpload = (idx: number) => {
    setUploadingRowIdx(idx);
    fileInputRef.current?.click();
  };

  const handleRowFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const rowIdx = uploadingRowIdx;
    if (!file || rowIdx === null) return;

    // Show temporary spinner in the row button
    updateRowField(rowIdx, 'arquivo_nome_exibicao', 'Enviando...');

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload-anexo', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (data.path) {
        updateRowFields(rowIdx, {
          arquivo_anexo: data.path,
          arquivo_nome_exibicao: file.name,
          arquivo_tamanhos: String(file.size),
        });
        showToast(`Anexo "${file.name}" carregado.`);
      } else {
        updateRowField(rowIdx, 'arquivo_nome_exibicao', '');
        showToast(`Erro no upload: ${data.erro || 'Falha desconhecida'}`);
      }
    } catch (err) {
      updateRowField(rowIdx, 'arquivo_nome_exibicao', '');
      showToast('Erro de rede ao carregar arquivo.');
    }

    setUploadingRowIdx(null);
    if (e.target) e.target.value = '';
  };

  const triggerGlobalUpload = () => {
    globalFileInputRef.current?.click();
  };

  const handleGlobalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload-anexo', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (data.path) {
        setRows(
          rows.map((r) => ({
            ...r,
            arquivo_anexo: data.path,
            arquivo_nome_exibicao: file.name,
            arquivo_tamanhos: String(file.size),
          }))
        );
        showToast(`Arquivo "${file.name}" aplicado a todas as linhas.`);
      } else {
        showToast(`Erro no upload: ${data.erro || 'Falha desconhecida'}`);
      }
    } catch (err) {
      showToast('Erro de rede ao carregar arquivo.');
    }

    if (e.target) e.target.value = '';
  };

  // ── Description Modal ────────────────────────────────────────────────────
  const openDescModal = (idx: number, currentVal: string) => {
    setActiveDescRowIdx(idx);
    setDescInputValue(currentVal);
    const row = rows.find(r => r.idx === idx);
    let initialRes = row?.resolucao || '';
    if (!initialRes) {
      const defRes = resolutions.find(r => r.isDefault);
      if (defRes) {
        initialRes = defRes.text;
      }
    }
    setResInputValue(initialRes);
    setDescModalOpen(true);
  };

  const saveDescription = () => {
    if (activeDescRowIdx !== null) {
      updateRowFields(activeDescRowIdx, {
        descricao: descInputValue,
        resolucao: resInputValue,
      });
    }
    setDescModalOpen(false);
    setActiveDescRowIdx(null);
  };

  // ── Gemini AI Operations ──────────────────────────────────────────────────
  const mapUrgencyNumberToText = (num?: number): string => {
    if (!num) return 'Média';
    const hasMuitoBaixa = (atendimento === 'ubs');
    if (num <= 1) return hasMuitoBaixa ? 'Muito Baixa' : 'Baixa';
    if (num === 2) return 'Baixa';
    if (num === 3) return 'Média';
    if (num === 4) return 'Alta';
    return 'Muito Alta';
  };

  const handleRefineWithGemini = async () => {
    if (activeDescRowIdx === null) return;
    const row = rows.find(r => r.idx === activeDescRowIdx);
    if (!row) return;

    setIsRefining(true);
    setRefinementError(null);
    setRefinementResult(null);

    try {
      const response = await fetch('/api/gemini?action=refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: row.assunto || 'Sem título',
          description: descInputValue || 'Sem descrição',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na otimização do chamado.');
      }

      const data = await response.json();
      setRefinementResult(data);
      
      if (data.refinedDescription) {
        setDescInputValue(data.refinedDescription);
      }
      
      updateRowFields(activeDescRowIdx, {
        assunto: data.refinedTitle || row.assunto,
        urgencia: mapUrgencyNumberToText(data.suggestedUrgency),
      });

      showToast('Chamado otimizado com sucesso pelo Gemini!');
    } catch (err: any) {
      console.error(err);
      setRefinementError(err.message || 'Erro ao conectar com o Gemini.');
      showToast('Falha ao otimizar com o Gemini.');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatSending) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newMsgs = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMsgs);
    setIsChatSending(true);

    try {
      let currentTicket = null;
      if (activeDescRowIdx !== null) {
        const r = rows.find(row => row.idx === activeDescRowIdx);
        if (r) {
          currentTicket = {
            title: r.assunto,
            description: descInputValue,
          };
        }
      }

      const response = await fetch('/api/gemini?action=chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMsgs,
          currentTicket,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na resposta do chat.');
      }

      const data = await response.json();
      if (data.text) {
        setChatMessages([...newMsgs, { role: 'assistant' as const, content: data.text }]);
      } else {
        throw new Error('Nenhuma resposta retornada pela IA.');
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages([...newMsgs, { role: 'assistant' as const, content: `❌ Erro ao obter resposta da IA: ${err.message || 'Erro de rede'}.` }]);
    } finally {
      setIsChatSending(false);
    }
  };

  const handleCreateTicketFromChat = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let title = 'Chamado Técnico do Assistente';
    let desc = text;

    if (lines.length > 0) {
      const firstLine = lines[0].replace(/^[#*-]\s*/, '').trim();
      if (firstLine.length < 50) {
        title = firstLine;
        desc = lines.slice(1).join('\n');
      } else {
        title = firstLine.substring(0, 47) + '...';
      }
    }

    addRow({
      assunto: title,
      descricao: desc,
      tipo_demanda: 'Requisição',
      urgencia: 'Média',
    });
    
    setChatOpen(false);
    showToast('Novo chamado inserido na tabela a partir do chat!');
  };

  // ── Upload Modal ─────────────────────────────────────────────────────────
  const openUploadModal = (idx: number) => {
    setUploadingModalRowIdx(idx);
    setModalUploadError(null);
    setUploadModalOpen(true);
  };

  const handleModalFilesSelected = async (files: FileList | File[]) => {
    if (uploadingModalRowIdx === null) return;

    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    // Validate size of each file
    const oversizedFiles = fileList.filter(f => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      const names = oversizedFiles.map(f => f.name).join(', ');
      setModalUploadError(`O(s) seguinte(s) arquivo(s) excedem o limite de 5 MB: ${names}`);
      return;
    }

    setModalUploadError(null);
    setIsUploadingInModal(true);

    const uploadedPaths: string[] = [];
    const uploadedNames: string[] = [];
    const uploadedSizes: string[] = [];

    try {
      for (const file of fileList) {
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/upload-anexo', {
          method: 'POST',
          body: fd,
        });

        const data = await res.json();
        if (data.path) {
          uploadedPaths.push(data.path);
          uploadedNames.push(file.name);
          uploadedSizes.push(String(file.size));
        } else {
          setModalUploadError(`Erro no upload do arquivo "${file.name}": ${data.erro || 'Falha desconhecida'}`);
          setIsUploadingInModal(false);
          return;
        }
      }

      // Append new files to any existing attachments for this row
      const currentRow = rows.find(r => r.idx === uploadingModalRowIdx);
      const existingPaths = currentRow?.arquivo_anexo ? currentRow.arquivo_anexo.split(',').filter(Boolean) : [];
      const existingNames = currentRow?.arquivo_nome_exibicao ? currentRow.arquivo_nome_exibicao.split(',').filter(Boolean) : [];
      const existingSizes = currentRow?.arquivo_tamanhos ? currentRow.arquivo_tamanhos.split(',').filter(Boolean) : [];

      const nextPaths = [...existingPaths, ...uploadedPaths];
      const nextNames = [...existingNames, ...uploadedNames];
      const nextSizes = [...existingSizes, ...uploadedSizes];

      updateRowFields(uploadingModalRowIdx, {
        arquivo_anexo: nextPaths.join(','),
        arquivo_nome_exibicao: nextNames.join(','),
        arquivo_tamanhos: nextSizes.join(','),
      });
      
      if (fileList.length === 1) {
        showToast(`Anexo "${fileList[0].name}" carregado.`);
      } else {
        showToast(`${fileList.length} anexos carregados com sucesso.`);
      }
    } catch (err) {
      setModalUploadError('Erro de rede ao carregar os arquivos.');
    } finally {
      setIsUploadingInModal(false);
    }
  };

  // ── Ticket Execution & Stream ─────────────────────────────────────────────
  const executarChamados = async () => {
    // 1. Gather rows
    const activeRows = rows.filter((r) => {
      const isSelected = r.selected !== false;
      const isNotBlank = (
        (r.cliente || '').trim() !== '' ||
        (r.catalogo || '').trim() !== '' ||
        (r.assunto || '').trim() !== '' ||
        (r.descricao || '').trim() !== ''
      );
      return isSelected && isNotBlank;
    });

    if (activeRows.length === 0) {
      showToast('Nenhum chamado selecionado e preenchido para executar.');
      return;
    }

    // 2. Validate mandatory fields
    let isValid = true;
    const updatedRows = rows.map((r) => {
      // Check if this row is active
      const isActive = activeRows.some((ar) => ar.idx === r.idx);
      if (!isActive) {
        return { ...r, invalidFields: [] }; // Reset invalid fields on non-active rows
      }

      const invalids: string[] = [];
      if (!(r.cliente || '').trim()) invalids.push('cliente');
      if (!(r.catalogo || '').trim()) invalids.push('catalogo');
      if (!(r.assunto || '').trim()) invalids.push('assunto');
      if (!(r.descricao || '').trim()) invalids.push('descricao');

      if (atendimento === 'ubs' || atendimento === 'manaus') {
        if (!r.fila?.trim()) invalids.push('fila');
      }

      if (atendimento === 'manaus') {
        if (!r.nome_usuario?.trim()) invalids.push('nome_usuario');
        if (!r.email_usuario?.trim()) invalids.push('email_usuario');
        if (!r.celular?.trim()) invalids.push('celular');
      }

      if (invalids.length > 0) {
        isValid = false;
      }

      return { ...r, invalidFields: invalids };
    });

    setRows(updatedRows);

    if (!isValid) {
      showToast('Preencha os campos obrigatórios destacados nos chamados selecionados.');
      return;
    }

    // Clear logs
    setLogs([]);
    successfulRowIndicesRef.current.clear();
    setJobStatus('running');
    appendClientLog('Solicitando execução de chamados...', 'system');

    // Initialize specific row logs to pending
    const initialRowLogs = { ...rowExecutionLogs };
    activeRows.forEach(row => {
      initialRowLogs[row.idx] = {
        status: 'pending',
        logs: [{
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          msg: `Aguardando processamento do chamado...`,
          nivel: 'system'
        }]
      };
    });
    setRowExecutionLogs(initialRowLogs);

    try {
      const response = await fetch('/api/executar-tabela', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chamados: activeRows, tecnico: userEmail }),
      });

      const data = await response.json();
      if (data.erro) {
        showToast(data.erro);
        setJobStatus('error');
        appendClientLog(`Erro ao iniciar job: ${data.erro}`, 'error');
        return;
      }

      setJobId(data.job_id);
      startLogStream(data.job_id);
    } catch (err) {
      showToast('Erro de conexão ao iniciar.');
      setJobStatus('error');
      appendClientLog('Erro de conexão com o servidor.', 'error');
    }
  };

  const startLogStream = (id: string) => {
    if (sseRef.current) sseRef.current.close();

    const sse = new EventSource(`/api/log-stream/${id}`);
    sseRef.current = sse;

    sse.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const level = data.nivel.toLowerCase() as 'info' | 'warning' | 'error' | 'system';
      appendClientLog(data.msg, level);
      if (typeof data.chamadoIdx === 'number') {
        appendRowLog(data.chamadoIdx, data.msg, level);
        if (data.msg.includes('✅') || data.msg.includes('SUCESSO')) {
          successfulRowIndicesRef.current.add(data.chamadoIdx);
        }
      }
    };

    sse.addEventListener('done', (e: any) => {
      const data = JSON.parse(e.data);
      setJobStatus(data.status);
      sse.close();
      sseRef.current = null;
      updateHistoryCount();

      // Filter out successfully registered rows from the table
      setRows((prevRows) => {
        const remaining = prevRows.filter((r) => !successfulRowIndicesRef.current.has(r.idx));
        if (remaining.length === 0) {
          // If all rows are sent, create a blank row with user's pre-definitions so the table is not empty
          setTimeout(() => {
            setNextRowId((prev) => prev + 1);
          }, 0);
          return [{
            idx: nextRowId,
            cliente: defaultCliente || '',
            tipo_demanda: 'Requisição',
            urgencia: 'Média',
            catalogo: '',
            assunto: '',
            descricao: '',
            nome_usuario: '',
            email_usuario: '',
            celular: '',
            fila: defaultFila || '',
            arquivo_anexo: '',
            arquivo_nome_exibicao: '',
            arquivo_tamanhos: '',
            invalidFields: [],
          }];
        }
        return remaining;
      });
    });

    sse.onerror = () => {
      appendClientLog('Fluxo de logs finalizado ou desconectado.', 'system');
      sse.close();
      sseRef.current = null;
    };
  };

  const cancelarExecucao = async () => {
    if (!jobId) return;
    showConfirm(
      'Cancelar Execução',
      'Deseja interromper o processamento atual? Os chamados já gerados continuarão criados.',
      async () => {
        appendClientLog('Solicitando cancelamento do processamento...', 'system');
        try {
          const res = await fetch(`/api/cancelar/${jobId}`, {
            method: 'POST',
          });
          const data = await res.json();
          if (data.erro) {
            showToast(data.erro);
          } else {
            setJobStatus('cancelled');
            appendClientLog('Processamento cancelado pelo operador.', 'warning');
          }
        } catch (err) {
          showToast('Erro de comunicação.');
        }
      }
    );
  };

  const appendClientLog = (msg: string, nivel: 'info' | 'warning' | 'error' | 'system') => {
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(), msg: `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`, nivel },
    ]);
  };

  const appendRowLog = (rowIdx: number, msg: string, nivel: 'info' | 'warning' | 'error' | 'system') => {
    setRowExecutionLogs((prev) => {
      const current = prev[rowIdx] || { status: 'pending', logs: [] };
      const newLogs = [
        ...current.logs,
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          msg,
          nivel,
        },
      ];

      let status = current.status;
      if (nivel === 'error') {
        status = 'error';
      } else if (msg.includes('✅') || msg.includes('SUCESSO')) {
        status = 'success';
      } else if (msg.includes('📝') || msg.includes('🚀') || msg.includes('Preparando') || msg.includes('Enviando')) {
        status = 'running';
      }

      return {
        ...prev,
        [rowIdx]: {
          status,
          logs: newLogs,
        },
      };
    });
  };

  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  // ── History Retrieval & Settings ─────────────────────────────────────────

  const openHistoryModal = () => {
    setHistorySearchQuery('');
    setHistoryModalOpen(true);
    fetch('/api/historico')
      .then((r) => r.json())
      .then((data) => setHistoryItems(data || []))
      .catch(() => showToast('Falha ao obter histórico.'));
  };

  const handleLimparHistorico = async () => {
    showConfirm(
      'Limpar Histórico',
      'Limpar o histórico de chamados gerados? Isso permitirá o reenvio duplicado dos mesmos dados se necessário.',
      async () => {
        try {
          const res = await fetch('/api/limpar-historico', { method: 'POST' });
          if (res.ok) {
            setTotalHistory(0);
            setHistoryItems([]);
            showToast('Histórico limpo.');
          }
        } catch (e) {}
      }
    );
  };

  const handleAddFromHistory = (item: HistoryItem) => {
    const isSingleBlankRow = rows.length === 1 && 
      (rows[0].cliente || '').trim() === '' &&
      (rows[0].catalogo || '').trim() === '' &&
      (rows[0].assunto || '').trim() === '' &&
      (rows[0].descricao || '').trim() === '';

    const newIdx = nextRowId;
    const newRow: ChamadoRow = {
      idx: newIdx,
      cliente: item.cliente || '',
      tipo_demanda: item.tipo_demanda || 'Requisição',
      urgencia: item.urgencia || 'Média',
      catalogo: item.catalogo || '',
      assunto: item.original_assunto !== undefined ? item.original_assunto : (item.assunto ? item.assunto.replace(/^\[.*?\]\s*/, '') : ''),
      descricao: item.descricao || '',
      nome_usuario: item.nome_usuario || '',
      email_usuario: item.email_usuario || '',
      celular: item.celular || '',
      fila: item.fila || '',
      arquivo_anexo: item.arquivo_anexo || '',
      arquivo_nome_exibicao: item.arquivo_nome_exibicao || '',
      arquivo_tamanhos: item.arquivo_tamanhos || '',
      invalidFields: [],
    };

    // Clear logs for the new index
    setRowExecutionLogs((prev) => {
      const next = { ...prev };
      delete next[newIdx];
      return next;
    });

    if (isSingleBlankRow) {
      setRows([newRow]);
    } else {
      setRows([...rows, newRow]);
    }
    setNextRowId(newIdx + 1);
    showToast('Chamado adicionado do histórico para repetição!');
  };

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-body)] text-[var(--text-main)] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--input-border-focus)] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-[var(--status-text)] tracking-wider">Iniciando FormCreator...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setEmailError(null);
      setPasswordError(null);
      
      let hasError = false;
      if (!loginEmail.trim()) {
        setEmailError('E-mail é obrigatório.');
        hasError = true;
      } else if (!loginEmail.includes('@') || !loginEmail.includes('.')) {
        setEmailError('Insira um formato de e-mail válido (ex: usuario@empresa.com).');
        hasError = true;
      }
      
      if (!loginPassword) {
        setPasswordError('Senha é obrigatória.');
        hasError = true;
      } else if (loginPassword.length < 4) {
        setPasswordError('A senha deve ter pelo menos 4 caracteres.');
        hasError = true;
      }
      
      if (hasError) return;
      
      setIsLoggingIn(true);
      
      // Simulate API call to authenticating GLPI
      setTimeout(() => {
        setIsLoggingIn(false);
        setUserEmail(loginEmail.trim());
        setIsLoggedIn(true);
        localStorage.setItem('glpi_user_email', loginEmail.trim());
        localStorage.setItem('glpi_logged_in', 'true');
        showToast(`Bem-vindo, ${loginEmail.trim().split('@')[0]}! Sessão iniciada.`);
      }, 1200);
    };

    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-[var(--bg-body)] text-[var(--text-main)] p-4 select-none relative overflow-hidden font-sans">
        {/* Decorative background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#89b4fa]/10 blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-8 relative z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3.5 bg-[#89b4fa]/10 text-[#89b4fa] rounded-2xl mb-4 border border-[#89b4fa]/20 shadow-inner">
              <ClipboardList size={28} />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-main)]">
              <span className="text-[#89b4fa] font-mono">FormCreator</span>
            </h2>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* E-mail Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider block">
                E-MAIL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--status-text)]">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="usuario@empresa.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg-focus)] border rounded-xl text-xs outline-none transition
                    ${emailError 
                      ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)] focus:border-[var(--input-invalid-border)]' 
                      : 'border-[var(--border-color)] focus:border-[var(--input-border-focus)]'
                    }`}
                />
              </div>
              {emailError && (
                <p className="text-[10px] font-semibold text-[var(--input-invalid-border)] mt-1">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider block">
                  Senha
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--status-text)]">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-[var(--input-bg-focus)] border rounded-xl text-xs outline-none transition
                    ${passwordError 
                      ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)] focus:border-[var(--input-invalid-border)]' 
                      : 'border-[var(--border-color)] focus:border-[var(--input-border-focus)]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--status-text)] hover:text-[var(--text-main)] transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[10px] font-semibold text-[var(--input-invalid-border)] mt-1">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember and theme options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded border-[var(--border-color)] bg-[var(--input-bg-focus)] text-[#89b4fa] focus:ring-[#89b4fa]/20 w-4 h-4 transition"
                />
                <span className="text-[10px] font-medium text-[var(--status-text)]">
                  Manter conectado neste dispositivo
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-[#89b4fa] text-[#1e1e2e] hover:bg-[#89b4fa]/90 active:scale-[0.99] transition-all rounded-xl text-xs font-bold shadow-md shadow-[#89b4fa]/10 hover:shadow-[#89b4fa]/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#1e1e2e] border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando no GLPI...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Helper Quick Login */}
          <div className="mt-6 pt-6 border-t border-[var(--border-color)]/60 text-center">
            <span className="text-[10px] text-[var(--status-text)] block mb-2">Acesso Rápido de Testes:</span>
            <button
              type="button"
              onClick={() => {
                setLoginEmail('saluxoxfcecon@gmail.com');
                setLoginPassword('123456');
                setEmailError(null);
                setPasswordError(null);
              }}
              className="text-[9px] font-semibold text-[#89b4fa] hover:bg-[#89b4fa]/10 px-2.5 py-1 rounded-full border border-[#89b4fa]/25 transition"
            >
              Preencher saluxoxfcecon@gmail.com
            </button>
          </div>
          
          {/* Theme selection in Login screen */}
          <div className="flex justify-center gap-3 mt-6 text-[10px] text-[var(--status-text)]">
            <span>Tema:</span>
            <button type="button" onClick={() => setTheme('light')} className={`hover:text-[var(--text-main)] ${theme === 'light' ? 'text-[#89b4fa] font-bold' : ''}`}>Claro</button>
            <button type="button" onClick={() => setTheme('dark')} className={`hover:text-[var(--text-main)] ${theme === 'dark' ? 'text-[#89b4fa] font-bold' : ''}`}>Escuro</button>
            <button type="button" onClick={() => setTheme('system')} className={`hover:text-[var(--text-main)] ${theme === 'system' ? 'text-[#89b4fa] font-bold' : ''}`}>Sistema</button>
          </div>
        </motion.div>
        
        {/* Toast rendering for login flow if toast active */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-[var(--toast-bg)] border border-[var(--border-color)] text-xs font-semibold text-[var(--toast-text)] shadow-2xl flex items-center gap-2 z-[200]"
            >
              <Check size={14} className="text-[#a6e3a1]" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const modalRow = rows.find(r => r.idx === uploadingModalRowIdx);
  const modalPaths = modalRow?.arquivo_anexo ? modalRow.arquivo_anexo.split(',').filter(Boolean) : [];
  const modalNames = modalRow?.arquivo_nome_exibicao ? modalRow.arquivo_nome_exibicao.split(',').filter(Boolean) : [];
  const modalSizesStr = modalRow?.arquivo_tamanhos ? modalRow.arquivo_tamanhos.split(',').filter(Boolean) : [];

  const modalSizes = modalNames.map((_, idx) => {
    const s = parseInt(modalSizesStr[idx], 10);
    return isNaN(s) ? 0 : s;
  });

  const modalTotalSizeBytes = modalSizes.reduce((acc, curr) => acc + curr, 0);
  const modalIsOverLimit = modalTotalSizeBytes > 5 * 1024 * 1024;

  // Filter clients for modal search
  const filteredClients = clientList.filter(c => {
    if (!searchCliente) return true;
    const term = searchCliente.toLowerCase().trim();
    return c.abreviatura.toLowerCase().includes(term) || 
           c.nome_completo.toLowerCase().includes(term);
  });

  // Filter queues for modal search
  const filteredFilas = filasCategorias.map(cat => {
    const matching = cat.filas.filter(f => {
      if (!searchFila) return true;
      return f.toLowerCase().includes(searchFila.toLowerCase().trim());
    });
    return {
      ...cat,
      filas: matching
    };
  }).filter(cat => cat.filas.length > 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-[var(--text-main)] bg-[var(--bg-body)] transition-colors duration-200 select-none">
      
      {/* ── Sidebar Component ── */}
      <aside 
        className={`bg-[var(--bg-header)] flex flex-col shrink-0 transition-all duration-300 z-30 
          ${sidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-[250px] border-r border-[var(--border-color)]'} 
          ${mobileSidebarOpen ? 'translate-x-0' : 'max-md:-translate-x-full'} 
          max-md:fixed max-md:h-full max-md:left-0 max-md:top-0`}
      >
        {!sidebarCollapsed && (
          <>
            {/* Sidebar Header */}
            <div className="h-[52px] flex items-center justify-between px-4 border-b border-[var(--border-color)]/20">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-[#89b4fa]" />
                <span className="font-bold text-sm tracking-wide text-[var(--text-main)]">FormCreator</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 hover:bg-[var(--border-color)]/30 rounded text-gray-400 hover:text-[var(--text-main)] transition-colors max-md:hidden cursor-pointer"
                  title="Recolher menu"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 hover:bg-[var(--border-color)]/30 rounded text-gray-400 hover:text-[var(--text-main)] transition-colors md:hidden cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5 scrollbar-thin">
              
              {/* Navegação entre Telas */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-[var(--status-text)]/70 uppercase tracking-wider px-2">Navegação</span>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setActiveView('gerador');
                      setMobileSidebarOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      activeView === 'gerador'
                        ? 'bg-[#89b4fa]/10 border-[#89b4fa]/20 text-[#89b4fa] font-semibold'
                        : 'bg-transparent border-transparent text-[var(--status-text)] hover:bg-[var(--border-color)]/30 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <ScrollText size={15} />
                    <span>Gerador de Chamados</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('relatorio');
                      setMobileSidebarOpen(false);
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      activeView === 'relatorio'
                        ? 'bg-[#89b4fa]/10 border-[#89b4fa]/20 text-[#89b4fa] font-semibold'
                        : 'bg-transparent border-transparent text-[var(--status-text)] hover:bg-[var(--border-color)]/30 hover:text-[var(--text-main)]'
                    }`}
                  >
                    <FileSpreadsheet size={15} />
                    <span>Relatório de Chamados</span>
                  </button>

                  {getLoggedUserRole() === 'admin' && (
                    <button
                      onClick={() => {
                        setActiveView('tabelas_apoio');
                        setMobileSidebarOpen(false);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        activeView === 'tabelas_apoio'
                          ? 'bg-[#89b4fa]/10 border-[#89b4fa]/20 text-[#89b4fa] font-semibold'
                          : 'bg-transparent border-transparent text-[var(--status-text)] hover:bg-[var(--border-color)]/30 hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Table size={15} />
                      <span>Tabelas de Apoio</span>
                    </button>
                  )}

                  {getLoggedUserRole() === 'admin' && (
                    <button
                      onClick={() => {
                        setActiveView('usuarios');
                        setMobileSidebarOpen(false);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        activeView === 'usuarios'
                          ? 'bg-[#89b4fa]/10 border-[#89b4fa]/20 text-[#89b4fa] font-semibold'
                          : 'bg-transparent border-transparent text-[var(--status-text)] hover:bg-[var(--border-color)]/30 hover:text-[var(--text-main)]'
                      }`}
                    >
                      <Users size={15} />
                      <span>Usuários GLPI</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section: Perfil de Atendimento */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setAtendimentoOpen(!atendimentoOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg border border-[var(--border-color)]/20 bg-[var(--border-color)]/5 hover:bg-[var(--border-color)]/15 hover:border-[var(--border-color)]/40 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ClipboardList size={15} className="text-[#89b4fa] shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[var(--status-text)]/70 font-bold uppercase tracking-wider leading-none mb-0.5">Atendimento</span>
                      <span className="text-xs font-semibold text-[var(--text-main)] truncate">
                        {atendimento === 'manaus' ? 'Atendimento Manaus' : 'Atendimento UBS'}
                      </span>
                    </div>
                  </div>
                  {atendimentoOpen ? <ChevronUp size={14} className="text-[var(--status-text)] shrink-0" /> : <ChevronDown size={14} className="text-[var(--status-text)] shrink-0" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {atendimentoOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden flex flex-col gap-1 pl-1.5 mt-1"
                    >
                      {[
                        { id: 'manaus', label: 'Atendimento Manaus', desc: 'Nome, Email, Celular, Anexo' },
                        { id: 'ubs', label: 'Atendimento UBS', desc: 'Fila obrigatória' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setAtendimento(m.id as any);
                            showToast(`Perfil de Atendimento alterado para: ${m.label}`);
                          }}
                          className={`flex flex-col px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                            atendimento === m.id
                              ? 'bg-[#89b4fa]/10 border-[#89b4fa]/20 text-[var(--text-main)]'
                              : 'bg-transparent border-transparent text-[var(--status-text)] hover:bg-[var(--border-color)]/20 hover:text-[var(--text-main)]'
                          }`}
                          title={m.desc}
                        >
                          <span className="text-xs font-semibold flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${atendimento === m.id ? 'bg-[#89b4fa]' : 'bg-[var(--status-text)]/50'}`} />
                            {m.label}
                          </span>
                          <span className="text-[9px] text-[var(--status-text)] mt-0.5 ml-3 truncate max-w-[190px]">{m.desc}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section: Kit Chamados */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setKitSidebarOpen(!kitSidebarOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg border border-[var(--border-color)]/20 bg-[var(--border-color)]/5 hover:bg-[var(--border-color)]/15 hover:border-[var(--border-color)]/40 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder size={15} className="text-[#a6e3a1] shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[var(--status-text)]/70 font-bold uppercase tracking-wider leading-none mb-0.5">Kits</span>
                      <span className="text-xs font-semibold text-[var(--text-main)] truncate">
                        Kits Locais ({kits.length})
                      </span>
                    </div>
                  </div>
                  {kitSidebarOpen ? <ChevronUp size={14} className="text-[var(--status-text)] shrink-0" /> : <ChevronDown size={14} className="text-[var(--status-text)] shrink-0" />}
                </button>

                <AnimatePresence initial={false}>
                  {kitSidebarOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden flex flex-col gap-1 pl-1.5 mt-1"
                    >
                      <button
                        onClick={() => {
                          setNewKitName('');
                          setModalCreateKitOpen(true);
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-[var(--border-color)]/60 text-[var(--status-text)] hover:text-[#89b4fa] hover:border-[#89b4fa]/40 hover:bg-[#89b4fa]/5 transition-all text-xs font-medium w-full text-left cursor-pointer"
                      >
                        <FolderPlus size={14} className="text-[#a6e3a1]" />
                        <span>Cadastrar Kit</span>
                      </button>

                      {kits.length === 0 ? (
                        <span className="text-[10px] text-[var(--status-text)] italic p-2 text-center bg-[var(--border-color)]/5 rounded-lg border border-[var(--border-color)]/20">Nenhum kit cadastrado</span>
                      ) : (
                        kits.map((kit) => (
                          <div 
                            key={kit.id}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[var(--border-color)]/20 bg-[var(--border-color)]/5 text-xs text-[var(--text-main)] hover:bg-[var(--border-color)]/15 hover:border-[var(--border-color)]/40 transition-all group gap-1.5 w-full"
                          >
                            <button
                              onClick={() => {
                                setActiveKitToEdit(kit);
                                setModalEditKitOpen(true);
                                setBulkCliente('');
                                setBulkFila('');
                              }}
                              className="flex-1 text-left truncate hover:text-[#89b4fa] min-w-0 cursor-pointer"
                              title={`Clique para gerenciar/editar o kit "${kit.name}" (${kit.rows.length} chamados)`}
                            >
                              <span className="font-semibold block truncate leading-tight">{kit.name}</span>
                              <span className="text-[9px] text-[var(--status-text)] block mt-0.5 leading-none">{kit.rows.length} chamado(s)</span>
                            </button>
                            
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                              {kit.rows.length > 0 && (
                                <button
                                  onClick={() => {
                                    setKitToPublish(kit);
                                    setModalPublishKitConfirmOpen(true);
                                  }}
                                  className="p-1 rounded text-[#a6e3a1] hover:bg-[#a6e3a1]/15 transition-colors shrink-0 cursor-pointer"
                                  title="Publicar Kit para a Equipe"
                                >
                                  <Share2 size={12} />
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  showConfirm(
                                    'Excluir Kit',
                                    `Deseja realmente excluir o kit "${kit.name}" de forma permanente? Esta ação não pode ser desfeita.`,
                                    () => {
                                      const updated = kits.filter((k) => k.id !== kit.id);
                                      saveKits(updated);
                                      showToast(`Kit "${kit.name}" removido.`);
                                    }
                                  );
                                }}
                                className="p-1 rounded text-[#f38ba8] hover:bg-[#f38ba8]/15 transition-colors shrink-0 cursor-pointer"
                                title="Remover Kit"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section: Resoluções */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setResolutionSidebarOpen(!resolutionSidebarOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg border border-[var(--border-color)]/20 bg-[var(--border-color)]/5 hover:bg-[var(--border-color)]/15 hover:border-[var(--border-color)]/40 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckSquare size={15} className="text-[#f9e2af] shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[var(--status-text)]/70 font-bold uppercase tracking-wider leading-none mb-0.5">Resolução</span>
                      <span className="text-xs font-semibold text-[var(--text-main)] truncate">
                        Resoluções Padrão ({resolutions.length})
                      </span>
                    </div>
                  </div>
                  {resolutionSidebarOpen ? <ChevronUp size={14} className="text-[var(--status-text)] shrink-0" /> : <ChevronDown size={14} className="text-[var(--status-text)] shrink-0" />}
                </button>

                <AnimatePresence initial={false}>
                  {resolutionSidebarOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden flex flex-col gap-1 pl-1.5 mt-1"
                    >
                      <button
                        onClick={() => {
                          setNewResolutionName('');
                          setNewResolutionText('');
                          setModalCreateResolutionOpen(true);
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-[var(--border-color)]/60 text-[var(--status-text)] hover:text-[#89b4fa] hover:border-[#89b4fa]/40 hover:bg-[#89b4fa]/5 transition-all text-xs font-medium w-full text-left cursor-pointer"
                      >
                        <Plus size={14} className="text-[#f9e2af]" />
                        <span>Cadastrar Resolução</span>
                      </button>

                      {resolutions.length === 0 ? (
                        <span className="text-[10px] text-[var(--status-text)] italic p-2 text-center bg-[var(--border-color)]/5 rounded-lg border border-[var(--border-color)]/20">Nenhuma resolução cadastrada</span>
                      ) : (
                        resolutions.map((res) => (
                          <div 
                            key={res.id}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition-all group gap-1.5 w-full
                              ${res.isDefault 
                                ? 'border-[#a6e3a1]/30 bg-[#a6e3a1]/5 text-[var(--text-main)]' 
                                : 'border-[var(--border-color)]/20 bg-[var(--border-color)]/5 text-[var(--status-text)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]/15'
                              }
                            `}
                          >
                            <button
                              onClick={() => {
                                handleSetDefaultResolution(res.id);
                              }}
                              className="flex-1 text-left min-w-0 flex items-center gap-1.5 cursor-pointer"
                              title={`Clique para definir "${res.name}" como padrão`}
                            >
                              <div className="shrink-0">
                                {res.isDefault ? (
                                  <Star size={12} className="text-[#f9e2af]" fill="#f9e2af" />
                                ) : (
                                  <Star size={12} className="text-gray-500 hover:text-[#f9e2af] transition-colors" />
                                )}
                              </div>
                              <div className="truncate min-w-0">
                                <span className="font-semibold block truncate leading-tight">{res.name}</span>
                                <span className="text-[9px] text-[var(--status-text)] block truncate mt-0.5 leading-none">{res.text}</span>
                              </div>
                            </button>
                            
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => {
                                  setActiveResolutionToEdit(res);
                                  setNewResolutionName(res.name);
                                  setNewResolutionText(res.text);
                                  setModalEditResolutionOpen(true);
                                }}
                                className="p-1 rounded hover:bg-[var(--border-color)]/30 text-gray-400 hover:text-[var(--text-main)] transition-colors cursor-pointer"
                                title="Editar Resolução"
                              >
                                <Settings size={12} />
                              </button>
                              
                              <button
                                onClick={() => {
                                  showConfirm(
                                    'Excluir Resolução',
                                    `Deseja realmente excluir a resolução "${res.name}"?`,
                                    () => handleDeleteResolution(res.id, res.name)
                                  );
                                }}
                                className="p-1 rounded text-[#f38ba8] hover:bg-[#f38ba8]/15 transition-colors cursor-pointer"
                                title="Remover Resolução"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Section: Kits Equipe */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setTeamKitsSidebarOpen(!teamKitsSidebarOpen)}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg border border-[var(--border-color)]/20 bg-[var(--border-color)]/5 hover:bg-[var(--border-color)]/15 hover:border-[var(--border-color)]/40 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users size={15} className="text-[#89b4fa] shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-[var(--status-text)]/70 font-bold uppercase tracking-wider leading-none mb-0.5">Equipe</span>
                      <span className="text-xs font-semibold text-[var(--text-main)] truncate">
                        Kits Compartilhados ({teamKits.length})
                      </span>
                    </div>
                  </div>
                  {teamKitsSidebarOpen ? <ChevronUp size={14} className="text-[var(--status-text)] shrink-0" /> : <ChevronDown size={14} className="text-[var(--status-text)] shrink-0" />}
                </button>

                <AnimatePresence initial={false}>
                  {teamKitsSidebarOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden flex flex-col gap-2.5 pl-1.5 mt-1"
                    >
                      {/* Search Bar for Team Kits */}
                      <div className="relative w-full px-1">
                        <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--status-text)]/60" />
                        <input
                          type="text"
                          value={teamKitsSearchQuery}
                          onChange={(e) => setTeamKitsSearchQuery(e.target.value)}
                          placeholder="Pesquisar kits..."
                          className="w-full bg-[var(--modal-input-bg)] border border-[var(--border-color)]/30 rounded-lg pl-7 pr-3 py-1 text-[11px] text-[var(--text-main)] outline-none transition focus:border-[#89b4fa]/40 placeholder:text-[var(--status-text)]/40"
                        />
                      </div>

                      {/* Kits Publicados Por Mim */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-[var(--status-text)]/70 uppercase tracking-wider px-1">
                          Meus Publicados ({teamKits.filter(k => k.author === userEmail).length})
                        </span>
                        {teamKits.filter(k => k.author === userEmail).length === 0 ? (
                          <span className="text-[10px] text-[var(--status-text)]/60 italic px-2 py-1.5 bg-[var(--border-color)]/5 border border-[var(--border-color)]/10 rounded-lg text-center">
                            Nenhum kit publicado por você.
                          </span>
                        ) : teamKits.filter(k => k.author === userEmail).filter(kit => {
                          if (!teamKitsSearchQuery.trim()) return true;
                          const q = teamKitsSearchQuery.toLowerCase();
                          return kit.name.toLowerCase().includes(q) || kit.code.toString().includes(q);
                        }).length === 0 ? (
                          <span className="text-[10px] text-[var(--status-text)]/60 italic px-2 py-1.5 bg-[var(--border-color)]/5 border border-[var(--border-color)]/10 rounded-lg text-center">
                            Sem resultados.
                          </span>
                        ) : (
                          teamKits.filter(k => k.author === userEmail).filter(kit => {
                            if (!teamKitsSearchQuery.trim()) return true;
                            const q = teamKitsSearchQuery.toLowerCase();
                            return kit.name.toLowerCase().includes(q) || kit.code.toString().includes(q);
                          }).map((kit) => (
                            <div 
                              key={kit.id}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[var(--border-color)]/20 bg-[var(--border-color)]/5 text-xs text-[var(--text-main)] group gap-1.5 w-full hover:border-[var(--border-color)]/40 transition-all"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1 py-0.5 rounded bg-[#89b4fa]/10 text-[#89b4fa] font-bold text-[8px] font-mono leading-none">
                                    #{kit.code}
                                  </span>
                                  <span className="font-semibold truncate block leading-tight" title={kit.name}>
                                    {kit.name}
                                  </span>
                                </div>
                                <span className="text-[9px] text-[var(--status-text)] block mt-0.5 leading-none">
                                  {kit.rows.length} chamado(s) • Você publicou
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  showConfirm(
                                    'Remover Publicação',
                                    `Deseja realmente remover o kit "${kit.name}" da lista da equipe?`,
                                    () => {
                                      const updated = teamKits.filter((k) => k.id !== kit.id);
                                      saveTeamKits(updated);
                                      showToast(`Publicação do kit "${kit.name}" removida.`);
                                    }
                                  );
                                }}
                                className="p-1 rounded text-[#f38ba8] hover:bg-[#f38ba8]/15 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 cursor-pointer"
                                title="Despublicar Kit"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Kits Disponíveis da Equipe */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-[var(--status-text)]/70 uppercase tracking-wider px-1">
                          Kits da Equipe Disponíveis ({teamKits.filter(k => k.author !== userEmail).length})
                        </span>
                        {teamKits.filter(k => k.author !== userEmail).length === 0 ? (
                          <span className="text-[10px] text-[var(--status-text)]/60 italic px-2 py-1.5 bg-[var(--border-color)]/5 border border-[var(--border-color)]/10 rounded-lg text-center">
                            Nenhum kit de outros usuários.
                          </span>
                        ) : teamKits.filter(k => k.author !== userEmail).filter(kit => {
                          if (!teamKitsSearchQuery.trim()) return true;
                          const q = teamKitsSearchQuery.toLowerCase();
                          return kit.name.toLowerCase().includes(q) || kit.code.toString().includes(q);
                        }).length === 0 ? (
                          <span className="text-[10px] text-[var(--status-text)]/60 italic px-2 py-1.5 bg-[var(--border-color)]/5 border border-[var(--border-color)]/10 rounded-lg text-center">
                            Sem resultados.
                          </span>
                        ) : (
                          teamKits.filter(k => k.author !== userEmail).filter(kit => {
                            if (!teamKitsSearchQuery.trim()) return true;
                            const q = teamKitsSearchQuery.toLowerCase();
                            return kit.name.toLowerCase().includes(q) || kit.code.toString().includes(q);
                          }).map((kit) => (
                            <div 
                              key={kit.id}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-[var(--border-color)]/20 bg-[var(--border-color)]/5 text-xs text-[var(--text-main)] group gap-1.5 w-full hover:border-[var(--border-color)]/40 transition-all"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1 py-0.5 rounded bg-[#a6e3a1]/10 text-[#a6e3a1] font-bold text-[8px] font-mono leading-none">
                                    #{kit.code}
                                  </span>
                                  <span className="font-semibold truncate block leading-tight" title={kit.name}>
                                    {kit.name}
                                  </span>
                                </div>
                                <span className="text-[9px] text-[var(--status-text)] block mt-0.5 truncate leading-none" title={kit.author}>
                                  {kit.rows.length} chamado(s) • {kit.author.split('@')[0]}
                                </span>
                              </div>
                              <button
                                onClick={() => handleImportTeamKit(kit)}
                                className="px-2 py-1 bg-[#89b4fa]/10 hover:bg-[#89b4fa]/20 text-[#89b4fa] font-bold text-[10px] rounded transition shrink-0 cursor-pointer"
                                title="Importar Kit"
                              >
                                Importar
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-[var(--border-color)]/20 text-center text-[10px] text-[var(--status-text)]">
              FormCreator v1.0
            </div>
          </>
        )}
      </aside>

      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
        />
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-body)] text-[var(--text-main)] transition-all">
        
        {/* Main Header */}
        <header className="bg-[var(--bg-header)] border-b border-[var(--border-color)] px-6 h-[52px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Desktop Sidebar Toggle when Retracted */}
            {sidebarCollapsed && (
              <button 
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 rounded hover:bg-[var(--border-color)] text-[var(--text-main)] max-md:hidden transition-colors"
                title="Expandir menu"
              >
                <Menu size={20} />
              </button>
            )}

            {/* Mobile Sidebar Toggle */}
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded hover:bg-[var(--border-color)] text-[var(--text-main)] md:hidden transition-colors"
              title="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-sm text-[var(--text-main)] tracking-tight flex items-center gap-2">
              <span className="text-[#a6e3a1] font-mono">FormCreator</span> — Gerador de Chamados Automáticos
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* User Profile display with integrated action buttons */}
            <div className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-lg bg-[var(--border-color)]/25 border border-[var(--border-color)]/40">
              <div className="w-5 h-5 rounded bg-[#89b4fa]/15 text-[#89b4fa] flex items-center justify-center shrink-0 max-sm:hidden">
                <User size={11} />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-main)] leading-none max-xs:max-w-[50px] truncate">
                    {userEmail.split('@')[0]}
                  </span>
                  <span className={`px-1 py-0.5 rounded text-[8px] font-bold leading-none shrink-0 ${getLoggedUserRole() === 'admin' ? 'bg-[#f38ba8]/15 text-[#f38ba8] border border-[#f38ba8]/20' : 'bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/20'}`}>
                    {getLoggedUserRole() === 'admin' ? 'ADMIN' : 'TÉCNICO'}
                  </span>
                </div>
                <span className="text-[9px] text-[var(--status-text)] truncate max-w-[125px] mt-0.5 leading-none max-sm:hidden" title={userEmail}>
                  {userEmail}
                </span>
              </div>

              {/* Divider */}
              <div className="w-[1px] h-5 bg-[var(--border-color)]/30 mx-1 shrink-0" />

              {/* Integrated Profile Action Buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={openEditProfile}
                  className="p-1.5 rounded-md text-[var(--status-text)] hover:bg-[var(--border-color)]/50 hover:text-[var(--text-main)] transition-colors cursor-pointer"
                  title="Configurações do Perfil"
                >
                  <Settings size={13} />
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem('glpi_user_email');
                    localStorage.removeItem('glpi_logged_in');
                    setIsLoggedIn(false);
                    setUserEmail('');
                    showToast('Sessão encerrada com sucesso.');
                  }}
                  className="p-1.5 rounded-md text-[#f38ba8] hover:bg-[#f38ba8]/15 hover:text-[#f35b80] transition-colors cursor-pointer"
                  title="Sair da Sessão"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content scroll window */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeView === 'usuarios' ? (
            getLoggedUserRole() !== 'admin' ? (
              /* Access Denied View */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-body)]">
                <div className="w-16 h-16 rounded-full bg-[#f38ba8]/10 text-[#f38ba8] flex items-center justify-center mb-4 border border-[#f38ba8]/20 shadow-lg">
                  <Lock size={28} />
                </div>
                <h2 className="text-lg font-bold text-[var(--text-main)] mb-1">Acesso Restrito</h2>
                <p className="text-xs text-[var(--status-text)] max-w-sm leading-relaxed mb-6">
                  Esta tela de cadastro e gerenciamento de técnicos é restrita a usuários com perfil de <strong>Administrador</strong>.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveView('gerador')}
                    className="px-4 py-2 bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:brightness-105 rounded-lg text-xs font-semibold border border-[var(--border-color)]/30 transition shadow-sm"
                  >
                    Voltar ao Gerador
                  </button>
                  <button
                    onClick={openEditProfile}
                    className="px-4 py-2 bg-[#89b4fa]/10 text-[#89b4fa] hover:bg-[#89b4fa]/20 border border-[#89b4fa]/20 rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Tornar-se Admin (Simular)
                  </button>
                </div>
              </div>
            ) : (
              /* User Management CRUD View */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--bg-body)]">
                {/* Section Header */}
                <div className="bg-[var(--bg-toolbar)] border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between shrink-0 select-none">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Users size={16} className="text-[#89b4fa]" />
                      <span>Gerenciamento de Técnicos GLPI</span>
                    </h2>
                    <p className="text-[10px] text-[var(--status-text)] mt-0.5">
                      Cadastre, consulte, edite e remova os técnicos autorizados a operar nesta plataforma.
                    </p>
                  </div>
                  <button
                    onClick={openCreateUserModal}
                    className="px-3.5 py-1.5 rounded-lg bg-[#89b4fa] hover:bg-[#89b4fa]/90 text-[#1e1e2e] text-xs font-bold flex items-center gap-1.5 shadow-md transition duration-200 cursor-pointer"
                  >
                    <Plus size={14} /> Novo Técnico
                  </button>
                </div>

                {/* Search & Stats Bar */}
                <div className="px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-toolbar)]/40 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-2.5 text-[var(--status-text)]" size={14} />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou e-mail..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full bg-[var(--modal-input-bg)] border border-[var(--modal-input-border)] rounded-lg pl-9 pr-8 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--input-border-focus)] transition placeholder-[var(--status-text)]"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => setUserSearchQuery('')}
                        className="absolute right-3 top-2.5 text-[var(--status-text)] hover:text-[var(--text-main)] transition"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-semibold text-[var(--status-text)]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#89b4fa]" />
                      Total: <strong className="text-[var(--text-main)]">{users.length}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#a6e3a1]" />
                      Ativos: <strong className="text-[var(--text-main)]">{users.filter(u => u.ativo).length}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-gray-500" />
                      Inativos: <strong className="text-[var(--text-main)]">{users.filter(u => !u.ativo).length}</strong>
                    </span>
                  </div>
                </div>

                {/* Technicians List / Table */}
                <div className="flex-1 overflow-auto p-6">
                  {users.filter(u => 
                    u.nome.toLowerCase().includes(userSearchQuery.toLowerCase().trim()) ||
                    u.email.toLowerCase().includes(userSearchQuery.toLowerCase().trim())
                  ).length === 0 ? (
                    <div className="h-48 border border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center text-center p-6 bg-[var(--border-color)]/5">
                      <div className="w-10 h-10 rounded-full bg-[var(--border-color)]/20 text-[var(--status-text)] flex items-center justify-center mb-3">
                        <Users size={18} />
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-main)]">Nenhum técnico encontrado</p>
                      <p className="text-[10px] text-[var(--status-text)] mt-1 max-w-xs">
                        Não há técnicos que correspondam ao termo pesquisado. Tente alterar sua busca ou crie um novo.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm bg-[var(--modal-bg)]/40 divide-y divide-[var(--border-color)]">
                      {/* Table Header for Desktop */}
                      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[var(--border-color)]/20 text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider max-md:hidden">
                        <div className="col-span-4">Técnico / Usuário</div>
                        <div className="col-span-3">E-mail</div>
                        <div className="col-span-2">Celular</div>
                        <div className="col-span-1.5 text-center">Perfil</div>
                        <div className="col-span-1 text-center">Status</div>
                        <div className="col-span-1 text-right">Ações</div>
                      </div>

                      {/* Rows */}
                      {users.filter(u => 
                        u.nome.toLowerCase().includes(userSearchQuery.toLowerCase().trim()) ||
                        u.email.toLowerCase().includes(userSearchQuery.toLowerCase().trim())
                      ).map((user) => (
                        <div key={user.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-xs text-[var(--text-main)] hover:bg-[var(--border-color)]/10 transition duration-150 max-md:flex max-md:flex-col max-md:items-start max-md:gap-2">
                          
                          {/* Name & Avatar */}
                          <div className="col-span-4 flex items-center gap-3 w-full">
                            <div className={`w-8 h-8 rounded-lg ${user.perfil === 'admin' ? 'bg-[#f38ba8]/10 text-[#f38ba8]' : 'bg-[#89b4fa]/10 text-[#89b4fa]'} border ${user.perfil === 'admin' ? 'border-[#f38ba8]/20' : 'border-[#89b4fa]/20'} flex items-center justify-center shrink-0 font-bold text-xs`}>
                              {user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold truncate text-[var(--text-main)]">
                                {user.nome}
                                {user.email.toLowerCase() === userEmail.toLowerCase() && (
                                  <span className="ml-1.5 px-1 py-0.5 bg-[#89b4fa]/15 text-[#89b4fa] rounded text-[8px] font-black uppercase">
                                    Você
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-[var(--status-text)] md:hidden">{user.email}</span>
                            </div>
                          </div>

                          {/* Email (Desktop Only) */}
                          <div className="col-span-3 text-[var(--text-main)]/90 truncate font-mono max-md:hidden">
                            {user.email}
                          </div>

                          {/* Phone */}
                          <div className="col-span-2 text-[var(--status-text)] font-mono max-md:hidden">
                            {user.celular || <span className="opacity-40 italic">Sem telefone</span>}
                          </div>

                          {/* Profile Badge */}
                          <div className="col-span-1.5 flex justify-center max-md:w-full max-md:justify-start">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                              user.perfil === 'admin' 
                                ? 'bg-[#f38ba8]/15 border-[#f38ba8]/30 text-[#f38ba8]' 
                                : 'bg-[#a6e3a1]/15 border-[#a6e3a1]/30 text-[#a6e3a1]'
                            }`}>
                              {user.perfil === 'admin' ? 'Administrador' : 'Técnico'}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="col-span-1 flex justify-center max-md:w-full max-md:justify-start">
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase cursor-pointer border transition-all duration-150 ${
                                user.ativo 
                                  ? 'bg-[#a6e3a1]/15 border-[#a6e3a1]/20 text-[#a6e3a1] hover:bg-[#a6e3a1]/25' 
                                  : 'bg-gray-500/10 border-gray-500/20 text-gray-500 hover:bg-gray-500/20'
                              }`}
                              title={user.ativo ? "Clique para desativar" : "Clique para ativar"}
                            >
                              {user.ativo ? 'Ativo' : 'Inativo'}
                            </button>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex items-center justify-end gap-1.5 max-md:w-full max-md:justify-end max-md:border-t max-md:border-[var(--border-color)]/30 max-md:pt-2">
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="p-1.5 rounded-md hover:bg-[var(--border-color)]/50 text-[#89b4fa] transition"
                              title="Editar usuário"
                            >
                              <Settings size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={user.email.toLowerCase() === userEmail.toLowerCase()}
                              className="p-1.5 rounded-md hover:bg-[var(--border-color)]/50 text-[#f38ba8] hover:text-[#f35b80] transition disabled:opacity-30 disabled:cursor-not-allowed"
                              title={user.email.toLowerCase() === userEmail.toLowerCase() ? "Você não pode excluir a si mesmo" : "Excluir técnico"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          ) : activeView === 'tabelas_apoio' ? (
            <div className="flex-1 overflow-y-auto select-text p-6 flex flex-col gap-6 scrollbar-thin">
              {/* Header */}
              <div className="flex flex-col gap-1.5 border-b border-[var(--border-color)]/30 pb-4">
                <div className="flex items-center gap-2.5">
                  <Database className="text-[#89b4fa]" size={20} />
                  <h2 className="text-base font-bold text-[var(--text-main)] tracking-tight">
                    Tabelas de Apoio & Referência
                  </h2>
                </div>
                <p className="text-xs text-[var(--status-text)]">
                  Cadastre e gerencie os Clientes, Catálogo de Serviços e Filas de Atendimento do sistema. As alterações aparecerão imediatamente para todos os técnicos.
                </p>
              </div>

              {/* View/Tab Selector inside the page */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[var(--border-color)]/5 border border-[var(--border-color)]/30 p-4 rounded-xl">
                {/* Tabs */}
                <div className="flex rounded-lg bg-[var(--border-color)]/20 p-0.5 border border-[var(--border-color)]/30 w-max shrink-0">
                  {[
                    { id: 'clientes', label: 'Clientes', count: clientList.length },
                    { id: 'catalogos', label: 'Catálogo de Serviços', count: catalogList.length },
                    { id: 'filas', label: 'Filas de Atendimento', count: filasCategorias.reduce((acc, curr) => acc + curr.filas.length, 0) }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setRefTableActiveTab(tab.id as any);
                        setRefTableSearchQuery('');
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        refTableActiveTab === tab.id
                          ? 'bg-[#89b4fa]/20 text-[#89b4fa] font-bold'
                          : 'text-[var(--status-text)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-[10px] bg-[var(--border-color)] px-1.5 py-0.5 rounded-full text-[var(--status-text)] font-mono">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--status-text)]" />
                  <input
                    type="text"
                    value={refTableSearchQuery}
                    onChange={(e) => setRefTableSearchQuery(e.target.value)}
                    placeholder="Pesquisar itens cadastrados..."
                    className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg pl-9 pr-8 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] placeholder-[var(--status-text)]"
                  />
                  {refTableSearchQuery && (
                    <button
                      onClick={() => setRefTableSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--status-text)] hover:text-[var(--text-main)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Split Layout: Add form on the left, current items list on the right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT SIDE: Form registration */}
                <div className="lg:col-span-4 border border-[var(--border-color)]/80 bg-[var(--modal-bg)]/20 p-5 rounded-xl shadow-sm flex flex-col gap-4">
                  <div className="border-b border-[var(--border-color)]/40 pb-2 flex items-center gap-2">
                    <Plus size={14} className="text-[#a6e3a1]" />
                    <h3 className="font-bold text-xs text-[var(--text-main)] uppercase tracking-wider">
                      Cadastrar Novo {refTableActiveTab === 'clientes' ? 'Cliente' : refTableActiveTab === 'catalogos' ? 'Serviço' : 'Fila'}
                    </h3>
                  </div>

                  {refTableActiveTab === 'clientes' && (
                    <form onSubmit={handleAddClient} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Abreviatura / Sigla</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: PZL, HUFM, FMT"
                          value={newClientAbrev}
                          onChange={(e) => setNewClientAbrev(e.target.value)}
                          className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Nome Completo do Cliente / Unidade</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: SES-AM - PZL - Policlinica Zeno Lanzini"
                          value={newClientNome}
                          onChange={(e) => setNewClientNome(e.target.value)}
                          className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingRefTable}
                        className="w-full py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-lg transition hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                      >
                        {submittingRefTable ? 'Cadastrando...' : 'Adicionar Cliente'}
                      </button>
                    </form>
                  )}

                  {refTableActiveTab === 'catalogos' && (
                    <form onSubmit={handleAddCatalog} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Caminho / Nome do Serviço</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Sistemas > Produtos » SX Sigma » Agenda"
                          value={newCatalogNome}
                          onChange={(e) => setNewCatalogNome(e.target.value)}
                          className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingRefTable}
                        className="w-full py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-lg transition hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                      >
                        {submittingRefTable ? 'Cadastrando...' : 'Adicionar Serviço'}
                      </button>
                    </form>
                  )}

                  {refTableActiveTab === 'filas' && (
                    <form onSubmit={handleAddFila} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Categoria / Setor</label>
                        <select
                          value={newFilaCategoria}
                          onChange={(e) => setNewFilaCategoria(e.target.value)}
                          className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)]"
                        >
                          {filasCategorias.map(c => (
                            <option key={c.nome} value={c.nome}>{c.nome}</option>
                          ))}
                          <option value="custom">+ Outra (Nova Categoria)</option>
                        </select>
                      </div>

                      {newFilaCategoria === 'custom' && (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Nova Categoria</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Salux > Novo Setor"
                            value={newFilaCategoriaCustom}
                            onChange={(e) => setNewFilaCategoriaCustom(e.target.value)}
                            className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)]"
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Nome da Fila</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Atendimento N3"
                          value={newFilaNome}
                          onChange={(e) => setNewFilaNome(e.target.value)}
                          className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingRefTable}
                        className="w-full py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-lg transition hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                      >
                        {submittingRefTable ? 'Cadastrando...' : 'Adicionar Fila'}
                      </button>
                    </form>
                  )}
                </div>

                {/* RIGHT SIDE: List matching current search and tab */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  {/* TAB: CLIENTES */}
                  {refTableActiveTab === 'clientes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clientList
                        .filter(c => {
                          const term = refTableSearchQuery.toLowerCase().trim();
                          return c.abreviatura.toLowerCase().includes(term) || c.nome_completo.toLowerCase().includes(term);
                        })
                        .map((c) => (
                          <div 
                            key={c.abreviatura}
                            className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--border-color)]/10 hover:border-[#89b4fa]/30 transition group gap-4 shadow-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs bg-[#89b4fa]/10 border border-[#89b4fa]/20 text-[#89b4fa] px-2 py-0.5 rounded w-max block mb-1.5">
                                {c.abreviatura}
                              </span>
                              <p className="text-xs text-[var(--text-main)] font-semibold truncate leading-normal" title={c.nome_completo}>
                                {c.nome_completo}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(c.abreviatura);
                                showToast(`Abreviatura "${c.abreviatura}" copiada!`);
                              }}
                              className="p-1.5 rounded bg-[var(--border-color)] text-[var(--text-main)] hover:text-white hover:bg-[var(--border-color)]/60 transition cursor-pointer text-[10px] font-bold flex items-center gap-1 shrink-0"
                              title="Copiar abreviatura"
                            >
                              <Copy size={11} />
                              <span>Copiar</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {refTableActiveTab === 'catalogos' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {catalogList
                        .filter(item => item.toLowerCase().includes(refTableSearchQuery.toLowerCase().trim()))
                        .map((cat) => {
                          const parts = cat.split(/[>»]/).map(p => p.trim());
                          const service = parts[parts.length - 1] || cat;
                          const category = parts.slice(0, parts.length - 1).join(' › ');

                          return (
                            <div 
                              key={cat}
                              className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--border-color)]/10 hover:border-[#89b4fa]/30 transition group gap-4 shadow-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[var(--text-main)] font-bold truncate leading-tight mb-1.5" title={service}>
                                  {service}
                                </p>
                                {category && (
                                  <p className="text-[10px] text-[var(--status-text)] truncate font-medium" title={category}>
                                    {category}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(cat);
                                  showToast('Item do catálogo copiado!');
                                }}
                                className="p-1.5 rounded bg-[var(--border-color)] text-[var(--text-main)] hover:text-white hover:bg-[var(--border-color)]/60 transition cursor-pointer text-[10px] font-bold flex items-center gap-1 shrink-0"
                                title="Copiar caminho completo"
                              >
                                <Copy size={11} />
                                <span>Copiar</span>
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {refTableActiveTab === 'filas' && (
                    <div className="flex flex-col gap-4">
                      {filasCategorias.map((cat) => {
                        const matchingFilas = cat.filas.filter(f => f.toLowerCase().includes(refTableSearchQuery.toLowerCase().trim()));
                        if (matchingFilas.length === 0) return null;

                        return (
                          <div key={cat.nome} className="border border-[var(--border-color)]/60 rounded-xl bg-[var(--border-color)]/5 overflow-hidden shadow-sm">
                            <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--table-th-text)] bg-[var(--border-color)]/25 border-b border-[var(--border-color)]/60">
                              {cat.nome}
                            </div>
                            
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {matchingFilas.map((f) => (
                                <div 
                                  key={f}
                                  className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-color)]/80 bg-[var(--modal-bg)] hover:border-[#89b4fa]/30 transition group gap-2 shadow-sm"
                                >
                                  <span className="text-xs text-[var(--text-main)] font-semibold truncate leading-none py-1">
                                    {f}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(f);
                                      showToast(`Fila "${f}" copiada!`);
                                    }}
                                    className="p-1.5 rounded bg-[var(--border-color)] text-[var(--status-text)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]/60 transition cursor-pointer shrink-0"
                                    title="Copiar nome da fila"
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : activeView === 'relatorio' ? (
            <RelatorioView userEmail={userEmail} userRole={getLoggedUserRole()} openEditProfile={openEditProfile} />
          ) : (
            <>
              {/* ── Toolbar ── */}
          <div className="bg-[var(--bg-toolbar)] border-b border-[var(--border-color)] px-6 py-2.5 flex items-center gap-2 shrink-0 flex-wrap select-none">
            
            <button
              onClick={executarChamados}
              disabled={jobStatus === 'running'}
              className="px-3.5 py-1.5 rounded bg-[var(--btn-executar-bg)] text-[var(--btn-executar-text)] text-xs font-bold flex items-center gap-1.5 shadow-sm transition hover:brightness-105 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={13} fill="currentColor" /> Executar
            </button>

            <div className="h-6 w-px bg-[var(--border-color)] mx-1" />

            <button
              onClick={() => addRow()}
              className="px-3.5 py-1.5 rounded bg-[var(--btn-add-bg)] text-[var(--btn-add-text)] text-xs font-semibold flex items-center gap-1 border border-emerald-500/10 transition hover:brightness-105"
            >
              <Plus size={13} /> Linha
            </button>

            <button
              onClick={handleLimparTabela}
              className="px-3 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-medium flex items-center gap-1 transition hover:brightness-110"
              title="Apaga todas as linhas da tabela"
            >
              <Trash2 size={13} /> Limpar tabela
            </button>

            <div className="h-6 w-px bg-[var(--border-color)] mx-1" />

            <button
              onClick={openHistoryModal}
              className="px-3 py-1.5 rounded bg-[var(--btn-historico-bg)] text-[var(--btn-historico-text)] text-xs font-semibold flex items-center gap-1 transition hover:brightness-105"
            >
              <ClipboardList size={13} /> Histórico <span className="opacity-70">({totalHistory})</span>
            </button>

            <div className="h-6 w-px bg-[var(--border-color)] mx-1" />

            <button
              onClick={() => setModalFavoritesListOpen(true)}
              className="px-3 py-1.5 rounded bg-[var(--btn-historico-bg)] text-[var(--btn-historico-text)] text-xs font-semibold flex items-center gap-1 transition hover:brightness-105"
              title="Visualizar chamados favoritos"
            >
              <Star size={13} className="text-yellow-400 fill-yellow-400" /> Favoritos <span className="opacity-70">({favorites.length})</span>
            </button>

            <button
              onClick={() => setModalKitsListOpen(true)}
              className="px-3 py-1.5 rounded bg-[var(--btn-historico-bg)] text-[var(--btn-historico-text)] text-xs font-semibold flex items-center gap-1 transition hover:brightness-105"
              title="Visualizar kits de chamados cadastrados"
            >
              <Folder size={13} className="text-[#a6e3a1]" /> Kit Chamados <span className="opacity-70">({kits.length})</span>
            </button>



            {/* Status Indicator */}
            <div className="ml-auto flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[var(--status-bg)] text-[var(--status-text)] 
                ${jobStatus === 'running' ? 'bg-[var(--status-run-bg)] text-[var(--status-run-text)]' : ''}
                ${jobStatus === 'done' ? 'bg-[var(--status-run-bg)] text-[var(--status-run-text)]' : ''}
                ${jobStatus === 'error' ? 'bg-[var(--status-err-bg)] text-[var(--status-err-text)]' : ''}
                ${jobStatus === 'cancelled' ? 'bg-[var(--status-bg)] text-[var(--status-text)]' : ''}
              `}>
                <span className={`w-1.5 h-1.5 rounded-full 
                  ${jobStatus === 'running' ? 'bg-[var(--status-run-text)] animate-pulse' : 'bg-gray-500'}
                  ${jobStatus === 'done' ? 'bg-[var(--status-run-text)]' : ''}
                  ${jobStatus === 'error' ? 'bg-[var(--status-err-text)]' : ''}
                `} />
                {jobStatus === 'idle' && '⏹ Aguardando'}
                {jobStatus === 'running' && '▶ Executando'}
                {jobStatus === 'done' && '✓ Concluído'}
                {jobStatus === 'error' && '✗ Erro'}
                {jobStatus === 'cancelled' && '⏹ Cancelado'}
              </span>

              <button
                onClick={() => setModalGlobalLogsOpen(true)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all duration-200
                  ${jobStatus === 'error'
                    ? 'bg-[#f38ba8]/20 border-[#f38ba8]/40 text-[#f38ba8] hover:bg-[#f38ba8]/30 animate-pulse'
                    : 'bg-[var(--status-bg)] border-[var(--border-color)]/50 text-[var(--status-text)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]/30'
                  }
                `}
                title="Ver Log de Execução Geral (Console)"
              >
                <ScrollText size={12} className={jobStatus === 'error' ? 'animate-bounce' : ''} />
                <span>Logs Geral</span>
              </button>
            </div>

          </div>

          {/* ── Main Editable Table ── */}
          <div className="flex-1 overflow-auto p-5 select-text">
            
            <table className="w-full border-collapse text-xs select-text" onPaste={handlePaste}>
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="w-10 pb-2 font-bold text-[var(--status-text)] text-center uppercase tracking-wider">Ok</th>
                  <th className="w-9 pb-2 font-bold text-[var(--status-text)] text-center uppercase tracking-wider">#</th>
                  <th className="min-w-[150px] pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">
                    Cliente <span className="text-[var(--table-th-req)]">*</span>
                  </th>
                  <th className="w-32 pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">Tipo Demanda</th>
                  <th className="w-28 pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">Urgência</th>
                  <th className="min-w-[150px] pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">
                    Catálogo <span className="text-[var(--table-th-req)]">*</span>
                  </th>
                  <th className="min-w-[180px] pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">
                    Assunto <span className="text-[var(--table-th-req)]">*</span>
                  </th>
                  <th className="w-36 pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">
                    Descrição <span className="text-[var(--table-th-req)]">*</span>
                  </th>

                  {/* Dynamic Columns based on Atendimento profile */}
                  {atendimento === 'manaus' && (
                    <>
                      <th className="min-w-[130px] pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">
                        Nome Usuário <span className="text-[var(--table-th-req)]">*</span>
                      </th>
                      <th className="min-w-[150px] pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">
                        Email <span className="text-[var(--table-th-req)]">*</span>
                      </th>
                      <th className="min-w-[120px] pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">
                        Celular <span className="text-[var(--table-th-req)]">*</span>
                      </th>
                    </>
                  )}

                  {(atendimento === 'ubs' || atendimento === 'manaus') && (
                    <th className="min-w-[130px] pl-[13px] pr-2 pb-2 text-left font-bold text-[var(--table-th-text)] uppercase tracking-wider">
                      Fila <span className="text-[var(--table-th-req)]">*</span>
                    </th>
                  )}

                  {atendimento === 'manaus' && (
                    <th className="w-28 pb-2 text-center font-bold text-[var(--table-th-text)] uppercase tracking-wider">Anexo</th>
                  )}

                  <th className="w-16 pb-2"></th>
                </tr>
              </thead>
              
              <tbody>
                {rows.map((row, index) => {
                  const isCliInvalid = row.invalidFields?.includes('cliente');
                  const isCatInvalid = row.invalidFields?.includes('catalogo');
                  const isAssInvalid = row.invalidFields?.includes('assunto');
                  const isDescInvalid = row.invalidFields?.includes('descricao');
                  const isFilaInvalid = row.invalidFields?.includes('fila');
                  const isNomeInvalid = row.invalidFields?.includes('nome_usuario');
                  const isEmailInvalid = row.invalidFields?.includes('email_usuario');
                  const isCelInvalid = row.invalidFields?.includes('celular');

                  // Filter lists for custom inline autocompletes
                  // Smart Autocomplete: If the current field value perfectly matches an option, we show all options.
                  // Otherwise, we filter by the text they have typed.
                  const isCliPerfectMatch = clientList.some(c => c.nome_completo === row.cliente || c.abreviatura === row.cliente);
                  const cliQuery = isCliPerfectMatch ? '' : (row.cliente || '').toLowerCase().trim();
                  const matchingClients = clientList.filter(c => 
                    !cliQuery ||
                    c.abreviatura.toLowerCase().includes(cliQuery) || 
                    c.nome_completo.toLowerCase().includes(cliQuery)
                  );

                  const isCatPerfectMatch = catalogList.some(cat => cat === row.catalogo);
                  const catQuery = isCatPerfectMatch ? '' : (row.catalogo || '').toLowerCase().trim();
                  const matchingCatalogs = catalogList.filter(item => 
                    !catQuery ||
                    item.toLowerCase().includes(catQuery)
                  );

                  const isFilaPerfectMatch = filasCategorias.some(cat => cat.filas.some(f => f === row.fila));
                  const filaQuery = isFilaPerfectMatch ? '' : (row.fila || '').toLowerCase().trim();
                  const matchingFilas = filasCategorias.map(cat => {
                    const matching = cat.filas.filter(f => 
                      !filaQuery ||
                      f.toLowerCase().includes(filaQuery)
                    );
                    return {
                      ...cat,
                      filas: matching
                    };
                  }).filter(cat => cat.filas.length > 0);

                  const isComplete = 
                    !!row.cliente?.trim() && 
                    !!row.catalogo?.trim() && 
                    !!row.assunto?.trim() && 
                    !!row.descricao?.trim() &&
                    ((atendimento !== 'ubs' && atendimento !== 'manaus') || !!row.fila?.trim()) &&
                    (atendimento !== 'manaus' || (!!row.nome_usuario?.trim() && !!row.email_usuario?.trim() && !!row.celular?.trim()));

                  return (
                    <tr 
                      key={row.idx}
                      className="group border-b border-[var(--border-color)] hover:bg-[var(--table-tr-hover)]/30 transition-colors"
                    >
                      {/* Checkbox "Pronto" */}
                      <td className="p-1 text-center select-none">
                        <input
                          type="checkbox"
                          checked={row.selected !== false}
                          onChange={() => toggleRowSelection(row.idx)}
                          className="rounded border-[var(--border-color)] bg-[var(--input-bg-focus)] text-[#a6e3a1] focus:ring-[#a6e3a1]/20 w-4 h-4 cursor-pointer transition"
                          title={row.selected !== false ? "Chamado selecionado para execução" : "Chamado desmarcado"}
                        />
                      </td>

                      {/* # Index */}
                      <td className="text-center text-[#6c7086] font-mono select-none py-1.5">{index + 1}</td>
                      
                      {/* Cliente input with custom autocomplete popover */}
                      <td className="p-1 relative">
                        <input
                          type="text"
                          value={row.cliente || ''}
                          onChange={(e) => {
                            handleClienteChange(row.idx, e.target.value);
                            setSearchAutocompleteText(e.target.value);
                          }}
                          onFocus={() => {
                            setLastFocusedRowIdx(row.idx);
                            setActiveRowAutocomplete(row.idx);
                            setActiveFieldAutocomplete('cliente');
                            setSearchAutocompleteText(row.cliente || '');
                          }}
                          onBlur={() => {
                            handleClienteBlur(row.idx, row.cliente || '');
                            setTimeout(() => {
                              setActiveRowAutocomplete(null);
                              setActiveFieldAutocomplete(null);
                            }, 180);
                          }}
                          placeholder="Ex: PZL, FMT, FCECON..."
                          autoComplete="off"
                          className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]
                            ${isCliInvalid ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)]' : 'border-transparent'}
                          `}
                        />
                        {activeRowAutocomplete === row.idx && activeFieldAutocomplete === 'cliente' && matchingClients.length > 0 && (
                          <div className="absolute left-0 mt-1 w-[380px] sm:w-[480px] max-h-80 overflow-y-auto bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl z-50 py-1 divide-y divide-[var(--border-color)]/30 scrollbar-thin">
                            {matchingClients.map((c) => (
                              <div
                                key={c.abreviatura}
                                onMouseDown={() => {
                                  updateRowField(row.idx, 'cliente', c.nome_completo);
                                  setActiveRowAutocomplete(null);
                                  setActiveFieldAutocomplete(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-[var(--border-color)]/50 transition flex items-center gap-3 cursor-pointer"
                              >
                                <span className="font-bold text-xs bg-[#89b4fa]/10 border border-[#89b4fa]/20 text-[#89b4fa] px-2 py-0.5 rounded shrink-0">
                                  {c.abreviatura}
                                </span>
                                <span className="text-xs text-[var(--text-main)] font-semibold truncate">{c.nome_completo}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Tipo de Demanda */}
                      <td className="p-1">
                        <select
                          value={row.tipo_demanda || 'Requisição'}
                          onChange={(e) => updateRowField(row.idx, 'tipo_demanda', e.target.value)}
                          className="w-full bg-transparent border border-transparent rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]"
                        >
                          {TIPOS.map((t) => (
                            <option key={t} value={t} className="bg-[var(--bg-header)] text-[var(--text-main)]">{t}</option>
                          ))}
                        </select>
                      </td>

                      {/* Urgência */}
                      <td className="p-1">
                        <select
                          value={row.urgencia || 'Média'}
                          onChange={(e) => updateRowField(row.idx, 'urgencia', e.target.value)}
                          className="w-full bg-transparent border border-transparent rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]"
                        >
                          {URGENCIAS.map((u) => (
                            <option key={u} value={u} className="bg-[var(--bg-header)] text-[var(--text-main)]">{u}</option>
                          ))}
                        </select>
                      </td>

                      {/* Catálogo input with custom autocomplete popover */}
                      <td className="p-1 relative">
                        <input
                          type="text"
                          value={row.catalogo || ''}
                          onChange={(e) => {
                            updateRowField(row.idx, 'catalogo', e.target.value);
                            setSearchAutocompleteText(e.target.value);
                          }}
                          onFocus={() => {
                            setLastFocusedRowIdx(row.idx);
                            setActiveRowAutocomplete(row.idx);
                            setActiveFieldAutocomplete('catalogo');
                            setSearchAutocompleteText(row.catalogo || '');
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setActiveRowAutocomplete(null);
                              setActiveFieldAutocomplete(null);
                            }, 180);
                          }}
                          placeholder="Pesquisar catálogo..."
                          autoComplete="off"
                          className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]
                            ${isCatInvalid ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)]' : 'border-transparent'}
                          `}
                        />
                        {activeRowAutocomplete === row.idx && activeFieldAutocomplete === 'catalogo' && matchingCatalogs.length > 0 && (
                          <div className="absolute left-0 mt-1 w-[450px] sm:w-[600px] max-h-96 overflow-y-auto bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl z-50 py-1 divide-y divide-[var(--border-color)]/30 scrollbar-thin">
                            {matchingCatalogs.map((cat) => {
                              const parts = cat.split(/[>»]/).map(p => p.trim());
                              const service = parts[parts.length - 1] || cat;
                              const category = parts.slice(0, parts.length - 1).join(' › ');

                              return (
                                <div
                                  key={cat}
                                  onMouseDown={() => {
                                    updateRowField(row.idx, 'catalogo', cat);
                                    setActiveRowAutocomplete(null);
                                    setActiveFieldAutocomplete(null);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-[var(--border-color)]/50 transition flex flex-col gap-1 cursor-pointer"
                                >
                                  <span className="font-bold text-xs text-[var(--text-main)]">{service}</span>
                                  {category && (
                                    <span className="text-[10px] text-[var(--status-text)] font-semibold truncate">{category}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Assunto */}
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.assunto || ''}
                          onChange={(e) => updateRowField(row.idx, 'assunto', e.target.value)}
                          placeholder="Assunto do chamado"
                          className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]
                            ${isAssInvalid ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)]' : 'border-transparent'}
                          `}
                        />
                      </td>

                      {/* Descrição - Opens Rich Modal */}
                      <td className="p-1 text-center">
                        <button
                          onClick={() => openDescModal(row.idx, row.descricao)}
                          className={`w-full py-1.5 px-2.5 rounded border border-transparent text-left truncate transition flex items-center justify-between
                            ${row.descricao 
                              ? 'bg-[#313244]/50 text-[#a6e3a1] font-semibold hover:border-[#a6e3a1]/30' 
                              : 'bg-[#313244]/30 text-gray-400 hover:border-[#89b4fa]/30'
                            }
                            ${isDescInvalid ? '!border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)]' : ''}
                          `}
                          title={row.descricao || 'Clique para adicionar descrição'}
                        >
                          <span className="truncate">{row.descricao ? '✓ Preenchida' : '+ Adicionar...'}</span>
                          <FileText size={11} className={row.descricao ? 'text-[#a6e3a1]' : 'text-gray-500'} />
                        </button>
                      </td>

                      {/* Nome Usuário (Manaus only) */}
                      {atendimento === 'manaus' && (
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.nome_usuario || ''}
                            onChange={(e) => updateRowField(row.idx, 'nome_usuario', e.target.value)}
                            placeholder="Nome Completo"
                            className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]
                              ${isNomeInvalid ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)]' : 'border-transparent'}
                            `}
                          />
                        </td>
                      )}

                      {/* Email (Manaus only) */}
                      {atendimento === 'manaus' && (
                        <td className="p-1">
                          <input
                            type="email"
                            value={row.email_usuario || ''}
                            onChange={(e) => updateRowField(row.idx, 'email_usuario', e.target.value)}
                            placeholder="email@exemplo.com"
                            className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]
                              ${isEmailInvalid ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)]' : 'border-transparent'}
                            `}
                          />
                        </td>
                      )}

                      {/* Celular (Manaus only) */}
                      {atendimento === 'manaus' && (
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.celular || ''}
                            onChange={(e) => updateRowField(row.idx, 'celular', e.target.value)}
                            placeholder="(XX) XXXXX-XXXX"
                            className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]
                              ${isCelInvalid ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)]' : 'border-transparent'}
                            `}
                          />
                        </td>
                      )}

                      {/* Fila (Manaus or UBS) */}
                      {(atendimento === 'ubs' || atendimento === 'manaus') && (
                        <td className="p-1 relative">
                          <input
                            type="text"
                            value={row.fila || ''}
                            onChange={(e) => {
                              updateRowField(row.idx, 'fila', e.target.value);
                              setSearchAutocompleteText(e.target.value);
                            }}
                            onFocus={() => {
                              setLastFocusedRowIdx(row.idx);
                              setActiveRowAutocomplete(row.idx);
                              setActiveFieldAutocomplete('fila');
                              setSearchAutocompleteText(row.fila || '');
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setActiveRowAutocomplete(null);
                                setActiveFieldAutocomplete(null);
                              }, 180);
                            }}
                            placeholder="Digitar ou selecionar fila..."
                            autoComplete="off"
                            className={`w-full bg-transparent border rounded px-2 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] focus:bg-[var(--input-bg-focus)]
                              ${isFilaInvalid ? 'border-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)]' : 'border-transparent'}
                            `}
                          />
                          {activeRowAutocomplete === row.idx && activeFieldAutocomplete === 'fila' && matchingFilas.length > 0 && (
                            <div className="absolute right-0 mt-1 w-[320px] sm:w-[420px] max-h-80 overflow-y-auto bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-lg shadow-2xl z-50 py-1 scrollbar-thin">
                              {matchingFilas.map((cat) => (
                                <div key={cat.nome} className="flex flex-col">
                                  <div className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--status-text)] bg-[var(--border-color)]/20 border-y border-[var(--border-color)]/20">
                                    {cat.nome}
                                  </div>
                                  {cat.filas.map((f) => (
                                    <div
                                      key={f}
                                      onMouseDown={() => {
                                        updateRowField(row.idx, 'fila', f);
                                        setActiveRowAutocomplete(null);
                                        setActiveFieldAutocomplete(null);
                                      }}
                                      className="w-full text-left px-5 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--border-color)]/50 transition cursor-pointer font-medium"
                                    >
                                      {f}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      )}

                      {/* Anexo Column (Manaus only) */}
                      {atendimento === 'manaus' && (
                        <td className="p-1">
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => openUploadModal(row.idx)}
                              className={`flex-1 py-1.5 px-2 rounded border border-transparent text-xs text-center flex items-center justify-center gap-1 transition
                                ${!!row.arquivo_anexo 
                                  ? 'bg-emerald-900/40 text-[#a6e3a1] font-semibold border-emerald-500/30 hover:bg-emerald-900/60' 
                                  : 'bg-[#313244]/30 text-gray-400 hover:border-[#89b4fa]/30'
                                }
                              `}
                              title={row.arquivo_nome_exibicao ? `Arquivos: ${row.arquivo_nome_exibicao.split(',').filter(Boolean).join(', ')}` : 'Anexar arquivos'}
                            >
                              <Paperclip size={12} className={!!row.arquivo_anexo ? 'text-[#a6e3a1]' : 'text-gray-500'} />
                              <span className="truncate max-w-[60px]">
                                {(() => {
                                  if (!row.arquivo_nome_exibicao) return 'Anexo';
                                  const names = row.arquivo_nome_exibicao.split(',').filter(Boolean);
                                  if (names.length === 0) return 'Anexo';
                                  if (names.length === 1) {
                                    return names[0].length > 8 ? `${names[0].substring(0, 8)}…` : names[0];
                                  }
                                  return `${names.length} arqs`;
                                })()}
                              </span>
                            </button>
                            {!!row.arquivo_anexo && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateRowFields(row.idx, {
                                    arquivo_anexo: '',
                                    arquivo_nome_exibicao: '',
                                    arquivo_tamanhos: '',
                                  });
                                  showToast('Todos os anexos foram removidos.');
                                }}
                                className="p-1.5 rounded border border-transparent bg-[#f38ba8]/10 text-[#f38ba8] hover:bg-[#f38ba8]/20 transition-colors shrink-0"
                                title="Remover todos os anexos"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Line Operations */}
                      <td className="p-1 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPopoverRowIdx(popoverRowIdx === row.idx ? null : row.idx);
                              setActiveRowForAction(row);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-[var(--text-main)] hover:bg-[#313244] transition-colors"
                            title="Mais Opções"
                          >
                            <MoreVertical size={13} />
                          </button>

                          {/* Popover Menu */}
                          {popoverRowIdx === row.idx && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPopoverRowIdx(null);
                                }}
                              />
                              <div 
                                className="absolute right-0 top-7 w-36 bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-50 py-1 text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => {
                                    setPopoverRowIdx(null);
                                    setNewFavoriteName('');
                                    setModalFavoriteNameOpen(true);
                                  }}
                                  className="w-full px-3 py-1.5 text-[11px] font-medium text-[var(--text-main)] hover:bg-[var(--border-color)]/50 flex items-center gap-1.5 transition-colors"
                                >
                                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                  Tornar Favorito
                                </button>
                                <button
                                  onClick={() => {
                                    setPopoverRowIdx(null);
                                    setModalAddRowToKitOpen(true);
                                  }}
                                  className="w-full px-3 py-1.5 text-[11px] font-medium text-[var(--text-main)] hover:bg-[var(--border-color)]/50 flex items-center gap-1.5 transition-colors"
                                >
                                  <Folder size={12} className="text-[#a6e3a1]" />
                                  Adicionar ao Kit
                                </button>
                              </div>
                            </>
                          )}

                          <button
                            onClick={() => setLogModalRowIdx(row.idx)}
                            className="p-1 rounded text-gray-400 hover:text-[#fab387] hover:bg-[#313244] transition-colors relative"
                            title="Ver Log de Execução"
                          >
                            <ScrollText size={13} />
                            {rowExecutionLogs[row.idx] && (
                              <span className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full 
                                ${rowExecutionLogs[row.idx].status === 'success' ? 'bg-[#a6e3a1]' : ''}
                                ${rowExecutionLogs[row.idx].status === 'error' ? 'bg-[#f38ba8]' : ''}
                                ${rowExecutionLogs[row.idx].status === 'running' ? 'bg-[#f9e2af] animate-pulse' : ''}
                                ${rowExecutionLogs[row.idx].status === 'pending' ? 'bg-[#89b4fa] animate-pulse' : ''}
                              `} />
                            )}
                          </button>

                          <button
                            onClick={() => duplicateRow(row.idx)}
                            className="p-1 rounded text-gray-400 hover:text-[#89b4fa] hover:bg-[#313244] transition-colors"
                            title="Duplicar linha"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={() => removeRow(row.idx)}
                            className="p-1 rounded text-gray-400 hover:text-[#f38ba8] hover:bg-[#313244] transition-colors"
                            title="Remover linha"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>

          </div>
          </>
          )}
        </main>
      </div>

      {/* ── Autocomplete Datallists ── */}
      <datalist id="clientes-dl">
        {clientList.map((c) => (
          <option key={c.abreviatura} value={c.abreviatura}>
            {c.abreviatura} — {c.nome_completo}
          </option>
        ))}
      </datalist>

      <datalist id="catalogos-dl">
        {catalogList.map((cat) => (
          <option key={cat} value={cat} />
        ))}
      </datalist>

      <datalist id="filas-dl">
        {filasCategorias.map((cat) =>
          cat.filas.map((f) => (
            <option key={f} value={f} />
          ))
        )}
      </datalist>

      {/* Hidden Files Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleRowFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.csv"
      />
      <input
        ref={globalFileInputRef}
        type="file"
        className="hidden"
        onChange={handleGlobalFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.csv"
      />

      {/* ── Modal: Gerenciar Técnico (Criar/Editar) ── */}
      <AnimatePresence>
        {userModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] px-4">
            <motion.form 
              onSubmit={handleSaveUser}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-visible relative"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between rounded-t-xl bg-[var(--modal-bg)]">
                <div className="flex items-center gap-2">
                  <Users className="text-[#89b4fa]" size={18} />
                  <h3 className="font-bold text-sm text-[var(--text-main)]">
                    {editingUser ? 'Editar Técnico GLPI' : 'Cadastrar Novo Técnico'}
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setUserModalOpen(false)} 
                  className="text-[var(--status-text)] hover:text-[var(--text-main)] transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex flex-col gap-4">
                {/* Nome Completo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    Nome Completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={userFormNome}
                    onChange={(e) => setUserFormNome(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className={`w-full bg-[var(--modal-input-bg)] border ${userFormErrors.nome ? 'border-red-400/50' : 'border-[var(--modal-input-border)]'} rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--input-border-focus)] transition placeholder-[var(--status-text)]`}
                  />
                  {userFormErrors.nome && (
                    <span className="text-[10px] text-red-400 font-bold">{userFormErrors.nome}</span>
                  )}
                </div>

                {/* E-mail */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    E-mail do GLPI <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={userFormEmail}
                    onChange={(e) => setUserFormEmail(e.target.value)}
                    placeholder="Ex: carlos.oliveira@salux.com.br"
                    className={`w-full bg-[var(--modal-input-bg)] border ${userFormErrors.email ? 'border-red-400/50' : 'border-[var(--modal-input-border)]'} rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--input-border-focus)] transition placeholder-[var(--status-text)]`}
                  />
                  {userFormErrors.email && (
                    <span className="text-[10px] text-red-400 font-bold">{userFormErrors.email}</span>
                  )}
                </div>

                {/* Celular / Telefone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    Celular (Opcional)
                  </label>
                  <input
                    type="text"
                    value={userFormCelular}
                    onChange={(e) => setUserFormCelular(e.target.value)}
                    placeholder="Ex: (11) 98888-7777"
                    className="w-full bg-[var(--modal-input-bg)] border border-[var(--modal-input-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[var(--input-border-focus)] transition placeholder-[var(--status-text)]"
                  />
                </div>

                {/* Perfil / Permissão */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    Perfil / Função no GLPI
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserFormPerfil('tecnico')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                        userFormPerfil === 'tecnico'
                          ? 'bg-[#a6e3a1]/10 border-[#a6e3a1]/50 text-[#a6e3a1] font-bold'
                          : 'bg-transparent border-[var(--border-color)]/30 text-[var(--status-text)] hover:bg-[var(--border-color)]/50'
                      }`}
                    >
                      <span className="text-xs font-bold">Técnico Comum</span>
                      <span className="text-[9px] opacity-75 mt-1 font-medium">Acesso padrão aos chamados</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserFormPerfil('admin')}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                        userFormPerfil === 'admin'
                          ? 'bg-[#f38ba8]/10 border-[#f38ba8]/50 text-[#f38ba8] font-bold'
                          : 'bg-transparent border-[var(--border-color)]/30 text-[var(--status-text)] hover:bg-[var(--border-color)]/50'
                      }`}
                    >
                      <span className="text-xs font-bold">Administrador</span>
                      <span className="text-[9px] opacity-75 mt-1 font-medium">Acesso total e gestão de usuários</span>
                    </button>
                  </div>
                </div>

                {/* Status Ativo / Inativo */}
                <div className="flex items-center justify-between p-2.5 bg-[var(--border-color)]/10 border border-[var(--border-color)]/30 rounded-lg">
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block">Técnico Ativo</span>
                    <span className="text-[9px] text-[var(--status-text)] block mt-0.5">Técnicos inativos não aparecem nos filtros.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUserFormAtivo(!userFormAtivo)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition border ${
                      userFormAtivo 
                        ? 'bg-[#a6e3a1]/20 border-[#a6e3a1]/40 text-[#a6e3a1]' 
                        : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
                    }`}
                  >
                    {userFormAtivo ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-2 bg-[var(--border-color)]/5 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:brightness-105 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-[#89b4fa] text-[#1e1e2e] hover:brightness-105 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Check size={14} /> {editingUser ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Descrição do Chamado ── */}
      <AnimatePresence>
        {descModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--text-main)]">Conteúdo Detalhado do Chamado</h3>
                <button onClick={() => setDescModalOpen(false)} className="text-[var(--status-text)] hover:text-[var(--text-main)] transition">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <FileText size={14} className="text-[#89b4fa]" />
                      Descrição do Chamado <span className="text-[var(--table-th-req)]">*</span>
                    </label>
                    <button
                      onClick={handleRefineWithGemini}
                      disabled={isRefining || !descInputValue.trim()}
                      className="px-2.5 py-1 rounded bg-gradient-to-r from-violet-600/30 to-sky-600/30 hover:from-violet-600/40 hover:to-sky-600/40 text-[10px] font-bold text-[#b4befe] border border-violet-500/30 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRefining ? (
                        <>
                          <RefreshCw size={10} className="animate-spin" />
                          <span>Otimizando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={10} className="text-yellow-400 fill-yellow-400" />
                          <span>Otimizar com IA Gemini</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={descInputValue}
                    onChange={(e) => setDescInputValue(e.target.value)}
                    placeholder={`Setor: TI\nSolicitante: João Silva\nDetalhes: Erro ao gerar fatura no módulo financeiro`}
                    className="w-full h-32 bg-[var(--modal-input-bg)] border border-[var(--modal-input-border)] rounded-lg p-3 text-xs text-[var(--text-main)] outline-none focus:border-[var(--input-border-focus)] resize-y font-sans"
                  />

                  {isRefining && (
                    <div className="p-3 bg-violet-950/10 rounded-lg border border-violet-500/20 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-[10px] text-[var(--status-text)] font-mono">
                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                        <span>O Gemini está analisando e estruturando o chamado...</span>
                      </div>
                      <div className="w-full bg-[var(--border-color)]/20 h-1 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-violet-500 to-sky-500 h-full w-2/3 animate-pulse" style={{ animationDuration: '1.5s' }} />
                      </div>
                    </div>
                  )}

                  {refinementError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{refinementError}</span>
                    </div>
                  )}

                  {refinementResult && (
                    <div className="p-3 bg-violet-950/20 border border-violet-500/20 rounded-lg flex flex-col gap-2 animate-fade-in text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                          <Sparkles size={11} className="text-yellow-400 fill-yellow-400" />
                          <span>Análise de IA Concluída</span>
                        </div>
                        <button
                          onClick={() => setRefinementResult(null)}
                          className="text-[9px] font-medium text-[var(--status-text)] hover:text-[var(--text-main)] transition"
                        >
                          Ocultar painel
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div className="text-[10px] text-[var(--text-main)] font-medium">
                          <strong>Novo Assunto Sugerido:</strong> <span className="font-semibold text-sky-400">{refinementResult.refinedTitle}</span>
                        </div>
                        <div className="text-[10px] text-[var(--status-text)] leading-relaxed">
                          <strong>Urgência Recomendada:</strong> <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">{mapUrgencyNumberToText(refinementResult.suggestedUrgency)}</span>
                          <p className="mt-1 italic text-[9px]">&ldquo;{refinementResult.urgencyJustification}&rdquo;</p>
                        </div>
                        {refinementResult.suggestedCategory && (
                          <div className="text-[10px] text-[var(--status-text)]">
                            <strong>Categoria Sugerida:</strong> <span className="text-[#a6e3a1] font-semibold">{refinementResult.suggestedCategory}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-[#a6e3a1]" />
                    Resolução (Segunda Interação)
                  </label>
                  <textarea
                    value={resInputValue}
                    onChange={(e) => setResInputValue(e.target.value)}
                    placeholder="Texto de resolução que será inserido ao fechar/resolver o chamado."
                    className="w-full h-24 bg-[var(--modal-input-bg)] border border-[var(--modal-input-border)] rounded-lg p-3 text-xs text-[var(--text-main)] outline-none focus:border-[var(--input-border-focus)] resize-y font-sans"
                  />
                </div>
                
                <div className="flex items-start gap-1.5 text-[10px] text-[var(--status-text)] leading-relaxed">
                  <Info size={13} className="shrink-0 text-[#89b4fa] mt-0.5" />
                  <p>
                    O formato <strong className="text-[var(--text-main)] font-bold">Rótulo: valor</strong> aplica negrito automaticamente no corpo do GLPI. A Resolução será adicionada como segunda interação.
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-[var(--log-bg)] border-t border-[var(--border-color)] flex justify-end gap-2">
                <button
                  onClick={() => setDescModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--border-color)]/30 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveDescription}
                  className="px-4 py-2 rounded text-xs font-bold bg-[#a6e3a1] text-[#1e1e2e] hover:brightness-105 active:brightness-95 transition"
                >
                  Confirmar Descrição
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Anexo do Chamado ── */}
      <AnimatePresence>
        {uploadModalOpen && uploadingModalRowIdx !== null && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--text-main)]">Anexar Arquivos ao Chamado</h3>
                <button 
                  onClick={() => {
                    if (!modalIsOverLimit) {
                      setUploadModalOpen(false);
                    }
                  }} 
                  className={`text-[var(--status-text)] hover:text-[var(--text-main)] transition ${modalIsOverLimit ? 'cursor-not-allowed opacity-50' : ''}`}
                  disabled={modalIsOverLimit}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      await handleModalFilesSelected(files);
                    }
                  }}
                  onClick={() => {
                    const el = document.getElementById('modal-file-input');
                    el?.click();
                  }}
                  className={`w-full h-44 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-3 p-4 cursor-pointer transition-all text-center select-none
                    ${isDragging 
                      ? 'border-[#89b4fa] bg-[#89b4fa]/10 text-[#89b4fa]' 
                      : 'border-[var(--border-color)] bg-[var(--modal-input-bg)] text-[var(--status-text)] hover:border-[#89b4fa]/40 hover:bg-[#89b4fa]/5'
                    }
                  `}
                >
                  <input
                    id="modal-file-input"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        await handleModalFilesSelected(files);
                      }
                      e.target.value = '';
                    }}
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.csv"
                  />

                  {isUploadingInModal ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-[#89b4fa] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-[var(--text-main)]">Enviando anexo(s)...</span>
                    </div>
                  ) : (
                    <>
                      <div className={`p-3 rounded-full bg-[#89b4fa]/10 text-[#89b4fa] transition-transform ${isDragging ? 'scale-110' : ''}`}>
                        <Upload size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[var(--text-main)]">
                          Selecione o(s) arquivo(s) ou arraste para dentro
                        </p>
                        <p className="text-[10px] text-[var(--status-text)]">
                          Formatos aceitos: PDF, Imagens, Planilhas, Documentos, ZIP, etc.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Show active files if already attached */}
                {modalNames.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    <p className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Arquivos Anexados ({modalNames.length})</p>
                    <div className="space-y-1.5">
                      {modalNames.map((name, i) => {
                        const size = modalSizes[i] || 0;
                        return (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-xs text-[#a6e3a1]">
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip size={13} className="shrink-0 text-[#a6e3a1]" />
                              <span className="truncate font-semibold">{name}</span>
                              <span className="text-[10px] text-gray-400 shrink-0">({formatBytes(size)})</span>
                            </div>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 const updatedPaths = modalPaths.filter((_, idx) => idx !== i);
                                 const updatedNames = modalNames.filter((_, idx) => idx !== i);
                                 const updatedSizes = modalSizesStr.filter((_, idx) => idx !== i);
                                 updateRowFields(uploadingModalRowIdx!, {
                                   arquivo_anexo: updatedPaths.join(','),
                                   arquivo_nome_exibicao: updatedNames.join(','),
                                   arquivo_tamanhos: updatedSizes.join(','),
                                 });
                                 showToast(`Anexo "${name}" removido.`);
                               }}
                               className="p-1 rounded text-[#f38ba8] hover:bg-[#f38ba8]/20 transition-colors shrink-0"
                               title="Remover este anexo"
                             >
                               <Trash2 size={13} />
                             </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tamanho total e soma */}
                    <div className="mt-3 pt-2.5 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                      <span className="text-[var(--status-text)] font-medium">Tamanho Total Anexado:</span>
                      <span className={`font-bold ${modalIsOverLimit ? 'text-[#f38ba8]' : 'text-[#a6e3a1]'}`}>
                        {formatBytes(modalTotalSizeBytes)} / 5.00 MB
                      </span>
                    </div>
                    {modalIsOverLimit && (
                      <p className="text-[10px] text-[#f38ba8] font-bold mt-1 text-right">
                        O tamanho máximo permitido de 5.00 MB foi excedido. Remova algum arquivo para prosseguir.
                      </p>
                    )}
                  </div>
                )}

                {modalUploadError && (
                  <p className="text-[11px] font-semibold text-[var(--input-invalid-border)] bg-[var(--input-invalid-bg)] px-3 py-2 rounded border border-[var(--input-invalid-border)]/30">
                    {modalUploadError}
                  </p>
                )}
              </div>

              {/* Rodapé with 5 MB information */}
              <div className="px-5 py-3.5 bg-[var(--log-bg)] border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[10px] font-medium text-[var(--status-text)]">
                  Máximo total: 5.00 MB
                </span>
                <button
                  onClick={() => {
                    if (!modalIsOverLimit) {
                      setUploadModalOpen(false);
                    }
                  }}
                  disabled={modalIsOverLimit}
                  className={`px-4 py-2 rounded text-xs font-bold transition
                    ${modalIsOverLimit 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' 
                      : 'bg-[#89b4fa] text-[#1e1e2e] hover:brightness-105 active:brightness-95'
                    }
                  `}
                >
                  Concluído
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Histórico de Chamados ── */}
      <AnimatePresence>
        {historyModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[var(--text-main)]">Histórico Geral de Chamados Aberto</h3>
                  {historyItems.length > 0 && (
                    <span className="text-[10px] font-bold text-[#89b4fa] bg-[#89b4fa]/10 border border-[#89b4fa]/20 px-2 py-0.5 rounded-full shrink-0">
                      {historyItems.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {historyItems.length > 0 && (
                    <button
                      onClick={handleLimparHistorico}
                      className="px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Apagar todo o histórico de chamados"
                    >
                      <Trash2 size={13} /> Limpar Histórico
                    </button>
                  )}
                  <button onClick={() => setHistoryModalOpen(false)} className="text-[var(--status-text)] hover:text-[var(--text-main)] transition p-1">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Barra de Busca de Histórico */}
              {historyItems.length > 0 && (
                <div className="px-6 py-3 border-b border-[var(--border-color)]/30 bg-[var(--bg-toolbar)] flex items-center gap-3 select-none shrink-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--status-text)]/70" size={13} />
                    <input
                      type="text"
                      placeholder="Pesquisar por ID, cliente, catálogo, assunto, descrição..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/50 rounded-lg pl-9 pr-8 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[#89b4fa]/40 transition"
                    />
                    {historySearchQuery && (
                      <button 
                        onClick={() => setHistorySearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--status-text)] hover:text-[var(--text-main)] transition"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  {historySearchQuery && (
                    <span className="text-[10px] font-bold text-[#89b4fa] bg-[#89b4fa]/10 border border-[#89b4fa]/20 px-2 py-1 rounded shrink-0">
                      Encontrados: {filteredHistoryItems.length}
                    </span>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto min-h-0 select-text">
                {historyItems.length === 0 ? (
                  <div className="py-20 text-center text-xs text-[var(--status-text)] italic">
                    Nenhum chamado gerado recentemente nesta sessão.
                  </div>
                ) : filteredHistoryItems.length === 0 ? (
                  <div className="py-20 text-center text-xs text-[var(--status-text)] italic">
                    Nenhum chamado corresponde aos filtros da pesquisa.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs select-text">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--table-th-bg)] text-[var(--status-text)] sticky top-0 font-bold uppercase tracking-wider">
                        <th className="px-6 py-3">Código GLPI</th>
                        <th className="px-6 py-3">Data e Hora</th>
                        <th className="px-6 py-3">Status Envio</th>
                        <th className="px-6 py-3">Cliente</th>
                        <th className="px-6 py-3">Assunto</th>
                        <th className="px-6 py-3">Catálogo</th>
                        <th className="px-6 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistoryItems.map((item) => (
                        <tr key={item.id} className="border-b border-[var(--border-color)]/50 hover:bg-[var(--table-tr-hover)]/30 transition-colors">
                          <td className="px-6 py-3 font-mono font-semibold text-[#89b4fa]">{item.id}</td>
                          <td className="px-6 py-3 text-[var(--status-text)]">{item.data}</td>
                          <td className="px-6 py-3">
                            <span className={`font-bold ${item.status === 'OK' ? 'text-[var(--badge-ok)]' : 'text-[var(--badge-erro)]'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-semibold text-[var(--text-main)]">{item.cliente}</td>
                          <td className="px-6 py-3 text-[var(--text-main)]/80">{item.assunto}</td>
                          <td className="px-6 py-3 text-[#89b4fa]/80 truncate max-w-[200px]" title={item.catalogo}>
                            {item.catalogo}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleAddFromHistory(item)}
                              className="px-2.5 py-1.5 bg-[#89b4fa]/10 hover:bg-[#89b4fa]/20 text-[#89b4fa] font-bold text-xs rounded transition flex items-center gap-1.5 ml-auto"
                              title="Adicionar chamado de volta à tabela ativa para repetição"
                            >
                              <Plus size={12} /> Repetir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Cadastrar Kit ── */}
      <AnimatePresence>
        {modalCreateKitOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl p-6"
            >
              <h3 className="font-bold text-sm text-[var(--text-main)] mb-4">Cadastrar Novo Kit</h3>
              <p className="text-xs text-[var(--status-text)] mb-4">
                Digite um nome para o seu kit de chamados. Você poderá adicionar chamados a este kit clicando no menu &quot;...&quot; de cada linha.
              </p>
              
              <input
                type="text"
                placeholder="Ex: Chamados de Segunda, Incidentes Redes..."
                value={newKitName}
                onChange={(e) => setNewKitName(e.target.value)}
                className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] mb-4"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setModalCreateKitOpen(false)}
                  className="px-3 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-semibold hover:brightness-105 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleCreateKit(newKitName)}
                  disabled={!newKitName.trim()}
                  className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 transition"
                >
                  Cadastrar Kit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Cadastrar Resolução ── */}
      <AnimatePresence>
        {modalCreateResolutionOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl p-6"
            >
              <h3 className="font-bold text-sm text-[var(--text-main)] mb-2 flex items-center gap-2">
                <CheckSquare className="text-[#f9e2af]" size={18} />
                Cadastrar Nova Resolução Padrão
              </h3>
              <p className="text-xs text-[var(--status-text)] mb-4">
                Cadastre textos de resolução que poderão ser usados como segunda interação ao fechar chamados.
              </p>
              
              <div className="flex flex-col gap-3 mb-5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Nome de Identificação</label>
                  <input
                    type="text"
                    placeholder="Ex: Resolução Técnica de Hardware, Finalização Sem Erros..."
                    value={newResolutionName}
                    onChange={(e) => setNewResolutionName(e.target.value)}
                    className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)]"
                    autoFocus
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Texto de Resolução</label>
                  <textarea
                    placeholder="Digite aqui o texto que será enviado na segunda interação do chamado..."
                    value={newResolutionText}
                    onChange={(e) => setNewResolutionText(e.target.value)}
                    className="w-full h-32 bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setModalCreateResolutionOpen(false)}
                  className="px-3 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-semibold hover:brightness-105 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateResolution}
                  disabled={!newResolutionName.trim() || !newResolutionText.trim()}
                  className="px-3 py-1.5 rounded bg-[#f9e2af] text-black text-xs font-bold hover:bg-[#f9e2af]/80 disabled:opacity-40 transition"
                >
                  Cadastrar Resolução
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Tabelas de Apoio (Cliente, Catálogo, Fila) ── */}
      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[110] px-4 py-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--border-color)]/10">
                <div className="flex items-center gap-2">
                  <Database className="text-[#89b4fa]" size={18} />
                  <h3 className="font-bold text-sm text-[var(--text-main)]">
                    Tabelas de Apoio & Referência
                  </h3>
                </div>
                <button 
                  onClick={() => setModalReferenceTablesOpen(false)} 
                  className="text-[var(--status-text)] hover:text-[var(--text-main)] transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Toolbar/Search inside Modal */}
              <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--border-color)]/5">
                {/* Tabs */}
                <div className="flex rounded-lg bg-[var(--border-color)]/20 p-0.5 border border-[var(--border-color)]/30">
                  {[
                    { id: 'clientes', label: 'Clientes', count: clientList.length },
                    { id: 'catalogos', label: 'Catálogo de Serviços', count: catalogList.length },
                    { id: 'filas', label: 'Filas de Atendimento', count: filasCategorias.reduce((acc, curr) => acc + curr.filas.length, 0) }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setRefTableActiveTab(tab.id as any);
                        setRefTableSearchQuery('');
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        refTableActiveTab === tab.id
                          ? 'bg-[#89b4fa]/20 text-[#89b4fa] font-bold'
                          : 'text-[var(--status-text)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-[10px] bg-[var(--border-color)] px-1.5 py-0.5 rounded-full text-[var(--status-text)] font-mono">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--status-text)]" />
                  <input
                    type="text"
                    value={refTableSearchQuery}
                    onChange={(e) => setRefTableSearchQuery(e.target.value)}
                    placeholder="Pesquisar itens..."
                    className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg pl-9 pr-8 py-1.5 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] placeholder-[var(--status-text)]"
                  />
                  {refTableSearchQuery && (
                    <button
                      onClick={() => setRefTableSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--status-text)] hover:text-[var(--text-main)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Informative Header / Helper Context */}
              <div className="px-6 py-2 bg-emerald-950/20 border-b border-emerald-500/10 text-[11px] text-emerald-400 flex items-center justify-between select-none">
                <span>
                  {lastFocusedRowIdx !== null ? (
                    <>
                      Linha ativa selecionada: <strong className="font-bold underline">Linha #{rows.findIndex(r => r.idx === lastFocusedRowIdx) + 1}</strong>. Clicar em <strong>Inserir</strong> preencherá esta linha correspondente.
                    </>
                  ) : (
                    <>
                      Nenhuma linha selecionada na tabela principal. Clique em <strong>Copiar</strong> para usar a área de transferência, ou selecione uma linha antes de abrir.
                    </>
                  )}
                </span>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-[var(--bg-body)]">
                
                {/* TAB: CLIENTES */}
                {refTableActiveTab === 'clientes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                    {clientList
                      .filter(c => {
                        const term = refTableSearchQuery.toLowerCase().trim();
                        return c.abreviatura.toLowerCase().includes(term) || c.nome_completo.toLowerCase().includes(term);
                      })
                      .map((c) => (
                        <div 
                          key={c.abreviatura}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--border-color)]/10 hover:border-[#89b4fa]/30 transition group gap-4 shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs bg-[#89b4fa]/10 border border-[#89b4fa]/20 text-[#89b4fa] px-2 py-0.5 rounded w-max block mb-1.5">
                              {c.abreviatura}
                            </span>
                            <p className="text-xs text-[var(--text-main)] font-semibold truncate leading-normal" title={c.nome_completo}>
                              {c.nome_completo}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(c.abreviatura);
                                showToast(`Abreviatura "${c.abreviatura}" copiada!`);
                              }}
                              className="p-1.5 rounded bg-[var(--border-color)] text-[var(--text-main)] hover:text-white hover:bg-[var(--border-color)]/60 transition cursor-pointer text-[10px] font-bold flex items-center gap-1"
                              title="Copiar abreviatura"
                            >
                              <Copy size={11} />
                              <span>Abrev</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                let targetIdx = lastFocusedRowIdx;
                                if (targetIdx === null) {
                                  if (rows.length > 0) targetIdx = rows[0].idx;
                                  else {
                                    addRow();
                                    targetIdx = nextRowId;
                                  }
                                }
                                updateRowField(targetIdx, 'cliente', c.nome_completo);
                                showToast(`Cliente inserido com sucesso!`);
                              }}
                              className="px-2.5 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 transition cursor-pointer text-[10px] font-bold"
                            >
                              Inserir
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* TAB: CATALOGOS */}
                {refTableActiveTab === 'catalogos' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                    {catalogList
                      .filter(item => item.toLowerCase().includes(refTableSearchQuery.toLowerCase().trim()))
                      .map((cat) => {
                        const parts = cat.split(/[>»]/).map(p => p.trim());
                        const service = parts[parts.length - 1] || cat;
                        const category = parts.slice(0, parts.length - 1).join(' › ');

                        return (
                          <div 
                            key={cat}
                            className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--border-color)] bg-[var(--border-color)]/10 hover:border-[#89b4fa]/30 transition group gap-4 shadow-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[var(--text-main)] font-bold truncate leading-tight mb-1.5">
                                {service}
                              </p>
                              {category && (
                                <p className="text-[10px] text-[var(--status-text)] truncate font-medium" title={category}>
                                  {category}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(cat);
                                  showToast('Item do catálogo copiado!');
                                }}
                                className="p-1.5 rounded bg-[var(--border-color)] text-[var(--text-main)] hover:text-white hover:bg-[var(--border-color)]/60 transition cursor-pointer text-[10px] font-bold flex items-center gap-1"
                                title="Copiar caminho completo"
                              >
                                <Copy size={11} />
                                <span>Copiar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  let targetIdx = lastFocusedRowIdx;
                                  if (targetIdx === null) {
                                    if (rows.length > 0) targetIdx = rows[0].idx;
                                    else {
                                      addRow();
                                      targetIdx = nextRowId;
                                    }
                                  }
                                  updateRowField(targetIdx, 'catalogo', cat);
                                  showToast(`Catálogo inserido com sucesso!`);
                                }}
                                className="px-2.5 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 transition cursor-pointer text-[10px] font-bold"
                              >
                                Inserir
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* TAB: FILAS */}
                {refTableActiveTab === 'filas' && (
                  <div className="flex flex-col gap-6">
                    {filasCategorias.map((cat) => {
                      const matchingFilas = cat.filas.filter(f => f.toLowerCase().includes(refTableSearchQuery.toLowerCase().trim()));
                      if (matchingFilas.length === 0) return null;

                      return (
                        <div key={cat.nome} className="border border-[var(--border-color)]/60 rounded-xl bg-[var(--border-color)]/5 overflow-hidden shadow-sm">
                          <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--table-th-text)] bg-[var(--border-color)]/25 border-b border-[var(--border-color)]/60">
                            {cat.nome}
                          </div>
                          
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                            {matchingFilas.map((f) => (
                              <div 
                                key={f}
                                className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-color)]/80 bg-[var(--modal-bg)] hover:border-[#89b4fa]/30 transition group gap-2 shadow-sm"
                              >
                                <span className="text-xs text-[var(--text-main)] font-semibold truncate leading-none py-1">
                                  {f}
                                </span>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(f);
                                      showToast(`Fila "${f}" copiada!`);
                                    }}
                                    className="p-1.5 rounded bg-[var(--border-color)] text-[var(--status-text)] hover:text-[var(--text-main)] hover:bg-[var(--border-color)]/60 transition cursor-pointer"
                                    title="Copiar nome da fila"
                                  >
                                    <Copy size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      let targetIdx = lastFocusedRowIdx;
                                      if (targetIdx === null) {
                                        if (rows.length > 0) targetIdx = rows[0].idx;
                                        else {
                                          addRow();
                                          targetIdx = nextRowId;
                                        }
                                      }
                                      updateRowField(targetIdx, 'fila', f);
                                      showToast(`Fila inserida com sucesso!`);
                                    }}
                                    className="px-2 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 hover:text-emerald-300 transition cursor-pointer text-[10px] font-bold"
                                  >
                                    Inserir
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end bg-[var(--border-color)]/10">
                <button
                  type="button"
                  onClick={() => setModalReferenceTablesOpen(false)}
                  className="px-4 py-2 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-semibold hover:brightness-105 transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Editar Resolução ── */}
      <AnimatePresence>
        {modalEditResolutionOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl p-6"
            >
              <h3 className="font-bold text-sm text-[var(--text-main)] mb-2 flex items-center gap-2">
                <Settings className="text-[#89b4fa]" size={18} />
                Editar Resolução Padrão
              </h3>
              <p className="text-xs text-[var(--status-text)] mb-4">
                Altere os campos da resolução selecionada.
              </p>
              
              <div className="flex flex-col gap-3 mb-5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Nome de Identificação</label>
                  <input
                    type="text"
                    placeholder="Ex: Resolução Técnica de Hardware..."
                    value={newResolutionName}
                    onChange={(e) => setNewResolutionName(e.target.value)}
                    className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)]"
                    autoFocus
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider">Texto de Resolução</label>
                  <textarea
                    placeholder="Digite aqui o texto que será enviado na segunda interação do chamado..."
                    value={newResolutionText}
                    onChange={(e) => setNewResolutionText(e.target.value)}
                    className="w-full h-32 bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setModalEditResolutionOpen(false);
                    setActiveResolutionToEdit(null);
                  }}
                  className="px-3 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-semibold hover:brightness-105 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateResolution}
                  disabled={!newResolutionName.trim() || !newResolutionText.trim()}
                  className="px-3 py-1.5 rounded bg-[#89b4fa] text-black text-xs font-bold hover:brightness-105 disabled:opacity-40 transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Tornar Favorito ── */}
      <AnimatePresence>
        {modalFavoriteNameOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl p-6"
            >
              <h3 className="font-bold text-sm text-[var(--text-main)] mb-4">Salvar nos Favoritos</h3>
              <p className="text-xs text-[var(--status-text)] mb-4">
                Dê um nome personalizado para salvar este chamado como favorito/modelo para uso futuro.
              </p>
              
              <input
                type="text"
                placeholder="Ex: Instalar Impressora Padrão, Reset de Senha..."
                value={newFavoriteName}
                onChange={(e) => setNewFavoriteName(e.target.value)}
                className="w-full bg-[var(--input-bg-focus)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-main)] outline-none transition focus:border-[var(--input-border-focus)] mb-4"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setModalFavoriteNameOpen(false)}
                  className="px-3 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-semibold hover:brightness-105 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleCreateFavorite(newFavoriteName)}
                  disabled={!newFavoriteName.trim()}
                  className="px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 disabled:opacity-40 transition"
                >
                  Salvar nos Favoritos
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Adicionar ao Kit ── */}
      <AnimatePresence>
        {modalAddRowToKitOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-[var(--text-main)]">Adicionar Chamado ao Kit</h3>
                <button onClick={() => setModalAddRowToKitOpen(false)} className="text-[var(--status-text)] hover:text-[var(--text-main)] transition">
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-[var(--status-text)] mb-4">
                Selecione um dos kits abaixo para adicionar este chamado. Qualquer chamado pode ser adicionado, mesmo incompleto.
              </p>
              
              <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto mb-4 pr-1">
                {kits.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--status-text)] italic border border-dashed border-[var(--border-color)] rounded-lg">
                    Nenhum kit cadastrado.<br />
                    Cadastre um kit primeiro no menu lateral.
                  </div>
                ) : (
                  kits.map((kit) => (
                    <button
                      key={kit.id}
                      onClick={() => handleAddRowToKit(kit.id)}
                      className="w-full p-2.5 rounded-lg border border-[var(--border-color)]/50 bg-[var(--border-color)]/10 hover:bg-[var(--border-color)]/30 text-xs font-semibold text-left text-[var(--text-main)] flex items-center justify-between transition-all"
                    >
                      <span>{kit.name}</span>
                      <span className="text-[10px] text-[var(--status-text)] font-normal">{kit.rows.length} chamados</span>
                    </button>
                  ))
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setModalAddRowToKitOpen(false)}
                  className="px-3 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-semibold hover:brightness-105 transition"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Listagem Geral de Kits (Top Bar) ── */}
      <AnimatePresence>
        {modalKitsListOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <Folder className="text-[#a6e3a1]" size={16} />
                  Kits de Chamados Cadastrados
                </h3>
                <button onClick={() => setModalKitsListOpen(false)} className="text-[var(--status-text)] hover:text-[var(--text-main)] transition">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 flex flex-col gap-3">
                {kits.length === 0 ? (
                  <div className="py-20 text-center text-xs text-[var(--status-text)] italic">
                    Nenhum kit de chamados cadastrado no sistema.
                  </div>
                ) : (
                  kits.map((kit) => (
                    <div 
                      key={kit.id} 
                      className="border border-[var(--border-color)]/80 bg-[var(--border-color)]/10 rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[var(--text-main)] truncate">{kit.name}</h4>
                        <span className="text-[10px] text-[var(--status-text)] block mt-0.5">
                          {kit.rows.length} chamado(s) armazenado(s) neste kit
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            loadKitAction(kit, false);
                            setModalKitsListOpen(false);
                          }}
                          className="px-2.5 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:brightness-105 text-[10px] font-bold transition"
                          title="Substitui todas as linhas da tabela pelos chamados deste kit"
                        >
                          Substituir Linhas
                        </button>
                        <button
                          onClick={() => {
                            loadKitAction(kit, true);
                            setModalKitsListOpen(false);
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#a6e3a1]/10 text-[#a6e3a1] hover:bg-[#a6e3a1]/20 text-[10px] font-bold transition"
                          title="Adiciona os chamados deste kit ao final da tabela atual"
                        >
                          Adicionar ao Final
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Listagem Geral de Favoritos (Top Bar) ── */}
      <AnimatePresence>
        {modalFavoritesListOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <Star className="text-yellow-400 fill-yellow-400" size={16} />
                  Chamados Favoritos / Modelos
                </h3>
                <button onClick={() => setModalFavoritesListOpen(false)} className="text-[var(--status-text)] hover:text-[var(--text-main)] transition">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 flex flex-col gap-3">
                {favorites.length === 0 ? (
                  <div className="py-20 text-center text-xs text-[var(--status-text)] italic">
                    Nenhum chamado favoritado recentemente nesta sessão.
                  </div>
                ) : (
                  favorites.map((fav) => (
                    <div 
                      key={fav.id} 
                      className="border border-[var(--border-color)]/80 bg-[var(--border-color)]/10 rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-yellow-400 flex items-center gap-1.5 truncate">
                          <Star size={12} className="fill-yellow-400" />
                          {fav.name}
                        </h4>
                        <div className="text-[10px] text-[var(--status-text)] flex flex-wrap gap-x-3 gap-y-1 mt-1 font-mono">
                          <span><strong>Cliente:</strong> {fav.row.cliente || 'Não informado'}</span>
                          <span><strong>Catálogo:</strong> {fav.row.catalogo || 'Não informado'}</span>
                          <span><strong>Assunto:</strong> {fav.row.assunto || 'Não informado'}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            handleLoadFavorite(fav);
                            setModalFavoritesListOpen(false);
                          }}
                          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition flex items-center gap-1"
                          title="Insere este favorito como uma nova linha na tabela"
                        >
                          <Plus size={12} /> Inserir Linha
                        </button>
                        <button
                          onClick={() => {
                            showConfirm(
                              'Excluir Favorito',
                              `Deseja realmente excluir o favorito "${fav.name}"? Esta ação não pode ser desfeita.`,
                              () => {
                                const updated = favorites.filter((f) => f.id !== fav.id);
                                saveFavorites(updated);
                                showToast(`Favorito "${fav.name}" removido.`);
                              }
                            );
                          }}
                          className="p-1.5 rounded text-[#f38ba8] hover:bg-[#f38ba8]/15 transition-colors shrink-0"
                          title="Excluir favorito"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Editar Kit (Gerenciar chamados individuais do kit) ── */}
      <AnimatePresence>
        {modalEditKitOpen && activeKitToEdit && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <Folder className="text-[#a6e3a1]" size={16} />
                      <span className="text-xs font-bold text-[var(--status-text)] uppercase tracking-wider">Nome do Kit:</span>
                    </div>
                    <input
                      type="text"
                      value={activeKitToEdit.name}
                      onChange={(e) => handleRenameKit(activeKitToEdit.id, e.target.value)}
                      placeholder="Digite o nome do kit..."
                      className="bg-[var(--modal-input-bg)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-sm text-[var(--text-main)] outline-none font-semibold focus:border-[#89b4fa]/50 w-full sm:max-w-[280px]"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--status-text)] block mt-1.5">
                    Gerencie os chamados individuais contidos neste kit. As alterações são salvas automaticamente.
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setModalEditKitOpen(false);
                    setActiveKitToEdit(null);
                  }} 
                  className="text-[var(--status-text)] hover:text-[var(--text-main)] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-6 flex flex-col gap-3">
                {activeKitToEdit.rows.length === 0 ? (
                  <div className="py-20 text-center text-xs text-[var(--status-text)] italic">
                    Este kit está vazio. Não há chamados salvos nele no momento.
                  </div>
                ) : (
                  <>
                    {/* Bulk Update Controls */}
                    <div className="border border-[var(--border-color)]/80 bg-[var(--border-color)]/20 rounded-xl p-4 flex flex-col gap-3 mb-2">
                      <span className="text-[10px] text-[var(--status-text)] font-bold uppercase tracking-wider">Alterar em Lote (Todos os Chamados)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-[var(--status-text)] font-medium">Cliente em Lote</label>
                          <input
                            type="text"
                            value={bulkCliente}
                            onChange={(e) => setBulkCliente(e.target.value)}
                            placeholder="Ex: PZL, FMT, FCECON..."
                            list="clientes-dl"
                            autoComplete="off"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyBulkChanges();
                              }
                            }}
                            className="bg-[var(--modal-input-bg)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none w-full focus:border-[#89b4fa]/50"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-[var(--status-text)] font-medium">Fila em Lote</label>
                          <input
                            type="text"
                            value={bulkFila}
                            onChange={(e) => setBulkFila(e.target.value)}
                            placeholder="Digite ou selecione a fila..."
                            list="filas-dl"
                            autoComplete="off"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyBulkChanges();
                              }
                            }}
                            className="bg-[var(--modal-input-bg)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none w-full focus:border-[#89b4fa]/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Individual ticket edit cards */}
                    {activeKitToEdit.rows.map((row: any, rIdx: number) => (
                      <div 
                        key={rIdx} 
                        className="border border-[var(--border-color)]/80 bg-[var(--border-color)]/10 rounded-xl p-4 flex flex-col gap-3 hover:border-[#a6e3a1]/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5 truncate">
                              <span className="px-1.5 py-0.5 rounded bg-[var(--border-color)] text-[10px] text-[var(--status-text)] font-mono">#{rIdx + 1}</span>
                              <span className="truncate"><strong>Assunto:</strong> {row.assunto || 'Sem assunto'}</span>
                            </div>
                            <div className="text-[10px] text-[var(--status-text)] flex flex-wrap gap-x-3 gap-y-1 mt-1.5 font-mono">
                              <span><strong>Demanda:</strong> {row.tipo_demanda || 'Requisição'}</span>
                              <span><strong>Urgência:</strong> {row.urgencia || 'Média'}</span>
                              <span><strong>Cliente:</strong> <span className={row.cliente ? "text-[#89b4fa] font-semibold" : "text-[var(--status-text)]/60 italic"}>{row.cliente || 'Não informado'}</span></span>
                              <span><strong>Fila:</strong> <span className={row.fila ? "text-[#a6e3a1] font-semibold text-[10px]" : "text-[var(--status-text)]/60 italic"}>{row.fila || 'Não informada'}</span></span>
                            </div>
                            <p className="text-[10px] text-[var(--status-text)]/80 line-clamp-2 mt-1.5 italic">
                              {row.descricao || 'Sem descrição'}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              showConfirm(
                                'Remover do Kit',
                                'Deseja realmente remover este chamado de dentro do kit? esta alteração será salva automaticamente.',
                                () => {
                                  handleDeleteRowFromKit(activeKitToEdit.id, rIdx);
                                }
                              );
                            }}
                            className="p-1.5 rounded text-[#f38ba8] hover:bg-[#f38ba8]/15 transition-colors shrink-0 self-start"
                            title="Excluir chamado do kit"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 bg-[var(--border-color)]/5">
                <button
                  onClick={handleApplyBulkChanges}
                  disabled={!bulkCliente.trim() && !bulkFila.trim()}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition ${
                    (!bulkCliente.trim() && !bulkFila.trim())
                      ? 'bg-gray-500/25 text-gray-500 cursor-not-allowed border border-gray-500/10'
                      : 'bg-[#a6e3a1] text-[#11111b] hover:brightness-105 cursor-pointer'
                  }`}
                >
                  Alterar
                </button>
                <button
                  onClick={() => {
                    setModalEditKitOpen(false);
                    setActiveKitToEdit(null);
                  }}
                  className="px-4 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-bold hover:brightness-105 transition"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Confirmar Publicação de Kit Equipe ── */}
      <AnimatePresence>
        {modalPublishKitConfirmOpen && kitToPublish && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[220] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--modal-bg)]">
                <div className="flex items-center gap-2">
                  <Globe className="text-[#a6e3a1]" size={18} />
                  <h3 className="font-bold text-sm text-[var(--text-main)]">Publicar Kit na Equipe</h3>
                </div>
                <button 
                  onClick={() => {
                    setModalPublishKitConfirmOpen(false);
                    setKitToPublish(null);
                  }} 
                  className="text-[var(--status-text)] hover:text-[var(--text-main)] transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] flex flex-col gap-4">
                {/* Warning Alert Box */}
                <div className="p-3.5 rounded-lg border border-[#f9e2af]/30 bg-[#f9e2af]/10 text-xs text-[#f9e2af] flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Aviso Importante</span>
                    <span>
                      Este kit ficará visível para <strong>toda a equipe</strong> no painel de kits compartilhados.
                    </span>
                    <span className="mt-1 font-medium opacity-90">
                      As únicas informações que enviadas são o <strong>Assunto</strong> e a <strong>Descrição</strong>. Outros dados como Cliente, E-mail, Celular e Fila são omitidos por questões de segurança e variação operacional.
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-[var(--status-text)] font-bold uppercase tracking-wider">Nome do Kit</span>
                  <span className="text-xs font-semibold px-3 py-2 rounded-lg bg-[var(--border-color)]/20 text-[var(--text-main)] border border-[var(--border-color)]/30">
                    {kitToPublish.name}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-[var(--status-text)] font-bold uppercase tracking-wider">Conteúdo a Ser Publicado ({kitToPublish.rows.length} chamados)</span>
                  <div className="flex flex-col gap-2 max-h-[25vh] overflow-y-auto border border-[var(--border-color)]/30 rounded-lg p-2 bg-[var(--border-color)]/5">
                    {kitToPublish.rows.map((row: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded border border-[var(--border-color)]/40 bg-[var(--border-color)]/10 text-[11px]">
                        <span className="font-bold block text-[var(--text-main)]">#{idx + 1} • {row.assunto || 'Sem assunto'}</span>
                        <span className="text-[10px] text-[var(--status-text)] line-clamp-2 mt-1">{row.descricao || 'Sem descrição'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 bg-[var(--border-color)]/5">
                <button
                  onClick={() => {
                    setModalPublishKitConfirmOpen(false);
                    setKitToPublish(null);
                  }}
                  className="px-4 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] text-xs font-bold hover:brightness-105 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handlePublishKit(kitToPublish);
                    setModalPublishKitConfirmOpen(false);
                    setKitToPublish(null);
                  }}
                  className="px-4 py-1.5 rounded bg-[#a6e3a1] text-[#11111b] text-xs font-bold hover:brightness-105 transition"
                >
                  Confirmar Publicação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Editar Perfil (Default Client and Queue settings) ── */}
      <AnimatePresence>
        {modalEditProfileOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-visible relative"
            >
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between rounded-t-xl bg-[var(--modal-bg)]">
                <div className="flex items-center gap-2">
                  <Settings className="text-[#89b4fa]" size={18} />
                  <h3 className="font-bold text-sm text-[var(--text-main)]">Editar Perfil & Configurações</h3>
                </div>
                <button onClick={() => setModalEditProfileOpen(false)} className="text-[var(--status-text)] hover:text-[var(--text-main)] transition">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <p className="text-xs text-[var(--status-text)] leading-relaxed">
                  Defina os valores padrão que serão preenchidos automaticamente para cada novo chamado criado na tabela. Você ainda poderá alterá-los livremente durante o preenchimento.
                </p>

                {/* Cliente Padrão */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    Cliente Padrão
                  </label>
                  <div className="relative">
                    <div className="flex items-center bg-[var(--modal-input-bg)] border border-[var(--modal-input-border)] rounded-lg px-3 py-1.5 focus-within:border-[var(--input-border-focus)] transition gap-2">
                      <input
                        type="text"
                        value={searchCliente}
                        onChange={(e) => {
                          setSearchCliente(e.target.value);
                          setTempClienteOpen(true);
                        }}
                        onFocus={() => {
                          setTempClienteOpen(true);
                          setTempFilaOpen(false);
                        }}
                        placeholder="Digite para buscar..."
                        className="w-full bg-transparent text-xs text-[var(--text-main)] outline-none border-none p-0 focus:ring-0 placeholder-[var(--status-text)]"
                      />
                      {searchCliente && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchCliente('');
                            setTempCliente('');
                          }}
                          className="text-[var(--status-text)] hover:text-[var(--text-main)] transition shrink-0"
                          title="Limpar seleção"
                        >
                          <X size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setTempClienteOpen(!tempClienteOpen);
                          setTempFilaOpen(false);
                          if (!tempClienteOpen) {
                            setSearchCliente('');
                          }
                        }}
                        className="text-[var(--status-text)] hover:text-[var(--text-main)] transition shrink-0"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    
                    {tempClienteOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setTempClienteOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-lg shadow-xl z-40 py-1 divide-y divide-[var(--border-color)]/30">
                          <button
                            type="button"
                            onClick={() => {
                              setTempCliente('');
                              setSearchCliente('');
                              setTempClienteOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--border-color)]/50 transition font-semibold"
                          >
                            (Nenhum cliente padrão)
                          </button>
                          {filteredClients.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-[var(--status-text)] italic">
                              Nenhum cliente encontrado
                            </div>
                          ) : (
                            filteredClients.map((c) => (
                              <button
                                key={c.abreviatura}
                                type="button"
                                onClick={() => {
                                  setTempCliente(c.nome_completo);
                                  setSearchCliente(`${c.abreviatura} — ${c.nome_completo}`);
                                  setTempClienteOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--border-color)]/50 transition flex flex-col gap-0.5 ${tempCliente === c.nome_completo ? 'bg-[var(--border-color)]/30 text-[var(--text-main)] font-semibold' : 'text-[var(--status-text)] hover:text-[var(--text-main)]'}`}
                              >
                                <span className="font-bold text-[var(--text-main)]">{c.abreviatura}</span>
                                <span className="text-[10px] text-[var(--text-main)]/80 truncate">{c.nome_completo}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Fila Padrão */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    Fila Padrão
                  </label>
                  <div className="relative">
                    <div className="flex items-center bg-[var(--modal-input-bg)] border border-[var(--modal-input-border)] rounded-lg px-3 py-1.5 focus-within:border-[var(--input-border-focus)] transition gap-2">
                      <input
                        type="text"
                        value={searchFila}
                        onChange={(e) => {
                          setSearchFila(e.target.value);
                          setTempFilaOpen(true);
                        }}
                        onFocus={() => {
                          setTempFilaOpen(true);
                          setTempClienteOpen(false);
                        }}
                        placeholder="Digite para buscar..."
                        className="w-full bg-transparent text-xs text-[var(--text-main)] outline-none border-none p-0 focus:ring-0 placeholder-[var(--status-text)]"
                      />
                      {searchFila && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchFila('');
                            setTempFila('');
                          }}
                          className="text-[var(--status-text)] hover:text-[var(--text-main)] transition shrink-0"
                          title="Limpar seleção"
                        >
                          <X size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setTempFilaOpen(!tempFilaOpen);
                          setTempClienteOpen(false);
                          if (!tempFilaOpen) {
                            setSearchFila('');
                          }
                        }}
                        className="text-[var(--status-text)] hover:text-[var(--text-main)] transition shrink-0"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    
                    {tempFilaOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setTempFilaOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-lg shadow-xl z-40 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTempFila('');
                              setSearchFila('');
                              setTempFilaOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--border-color)]/50 transition font-semibold border-b border-[var(--border-color)]/30"
                          >
                            (Nenhuma fila padrão)
                          </button>
                          {filteredFilas.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-[var(--status-text)] italic">
                              Nenhuma fila encontrada
                            </div>
                          ) : (
                            filteredFilas.map((cat) => (
                              <div key={cat.nome} className="flex flex-col">
                                <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-main)] bg-[var(--border-color)]/20 border-y border-[var(--border-color)]/20">
                                  {cat.nome}
                                </div>
                                {cat.filas.map((f) => (
                                  <button
                                    key={f}
                                    type="button"
                                    onClick={() => {
                                      setTempFila(f);
                                      setSearchFila(f);
                                      setTempFilaOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-1.5 text-xs hover:bg-[var(--border-color)]/50 transition ${tempFila === f ? 'bg-[var(--border-color)]/30 text-[var(--text-main)] font-semibold' : 'text-[var(--text-main)]'}`}
                                  >
                                    {f}
                                  </button>
                                ))}
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Perfil de Acesso (Teste de Permissão) */}
                <div className="flex flex-col gap-1.5 pt-4 border-t border-[var(--border-color)]/30">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    Perfil de Acesso
                  </label>
                  <div className="flex items-center justify-between bg-[var(--border-color)]/10 p-2.5 rounded-lg border border-[var(--border-color)]/30 gap-3">
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-[var(--text-main)] block">Sua Função Atual</span>
                      <span className="text-[9px] text-[var(--status-text)] block mt-0.5 leading-snug">
                        Altere sua função para simular restrições e testar o acesso de administrador.
                      </span>
                    </div>
                    <div className="flex rounded-lg bg-[var(--border-color)]/20 p-0.5 border border-[var(--border-color)]/35 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updatedUsers = users.map(u => u.email.toLowerCase() === userEmail.toLowerCase() ? { ...u, perfil: 'tecnico' as const } : u);
                          const hasUs = users.some(u => u.email.toLowerCase() === userEmail.toLowerCase());
                          if (!hasUs) {
                            updatedUsers.push({
                              id: generateUniqueId(),
                              nome: userEmail.split('@')[0],
                              email: userEmail,
                              celular: '',
                              perfil: 'tecnico',
                              ativo: true
                            });
                          }
                          setUsers(updatedUsers);
                          localStorage.setItem('glpi_technicians', JSON.stringify(updatedUsers));
                          showToast('Perfil alterado para TÉCNICO. Telas de admin serão bloqueadas.');
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                          getLoggedUserRole() === 'tecnico' 
                            ? 'bg-[#a6e3a1]/25 text-[#a6e3a1]' 
                            : 'text-[var(--status-text)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Técnico
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedUsers = users.map(u => u.email.toLowerCase() === userEmail.toLowerCase() ? { ...u, perfil: 'admin' as const } : u);
                          const hasUs = users.some(u => u.email.toLowerCase() === userEmail.toLowerCase());
                          if (!hasUs) {
                            updatedUsers.push({
                              id: generateUniqueId(),
                              nome: userEmail.split('@')[0],
                              email: userEmail,
                              celular: '',
                              perfil: 'admin',
                              ativo: true
                            });
                          }
                          setUsers(updatedUsers);
                          localStorage.setItem('glpi_technicians', JSON.stringify(updatedUsers));
                          showToast('Perfil alterado para ADMIN. Acesso total concedido!');
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded transition-all ${
                          getLoggedUserRole() === 'admin' 
                            ? 'bg-[#f38ba8]/25 text-[#f38ba8]' 
                            : 'text-[var(--status-text)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tema / Configurações */}
                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-[var(--border-color)]/30">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    Tema da Interface
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', label: 'Claro', icon: <Sun size={14} className="text-yellow-400" /> },
                      { id: 'dark', label: 'Escuro', icon: <Moon size={14} className="text-blue-400" /> },
                      { id: 'system', label: 'Sistema', icon: <Settings size={14} className="text-purple-400" /> }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTheme(t.id as any);
                          localStorage.setItem('glpi_theme', t.id);
                          showToast(`Tema alterado para: ${t.label}`);
                        }}
                        className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${
                          theme === t.id
                            ? 'bg-[#89b4fa]/10 border-[#89b4fa]/50 text-[var(--text-main)] font-bold'
                            : 'bg-transparent border-[var(--border-color)]/30 text-[var(--status-text)] hover:bg-[var(--border-color)]/50'
                        }`}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-2 bg-[var(--border-color)]/5 rounded-b-xl">
                <button
                  onClick={() => setModalEditProfileOpen(false)}
                  className="px-3.5 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:brightness-105 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-3.5 py-1.5 rounded bg-[#89b4fa]/10 text-[#89b4fa] hover:bg-[#89b4fa]/20 border border-[#89b4fa]/20 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Check size={14} /> Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Custom Confirmation Dialog ── */}
      <AnimatePresence>
        {confirmOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[250] px-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-fade-in"
            >
              <div className="px-6 py-5 flex flex-col gap-2">
                <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  {confirmTitle}
                </h3>
                <p className="text-xs text-[var(--status-text)] leading-relaxed mt-1">
                  {confirmMessage}
                </p>
              </div>

              <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-2 bg-[var(--border-color)]/5">
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    if (confirmCancelAction) {
                      confirmCancelAction();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:brightness-105 text-xs font-semibold transition"
                >
                  {confirmCancelLabel}
                </button>
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    if (onConfirmAction) {
                      onConfirmAction();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded bg-[#f38ba8]/10 text-[#f38ba8] hover:bg-[#f38ba8]/20 border border-[#f38ba8]/20 hover:brightness-105 text-xs font-bold transition"
                >
                  {confirmOkLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Log de Execução do Chamado ── */}
      <AnimatePresence>
        {logModalRowIdx !== null && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[150] px-4 backdrop-blur-xs select-text">
            {(() => {
              const selectedRowForLogs = rows.find(r => r.idx === logModalRowIdx);
              const selectedRowLogsObj = rowExecutionLogs[logModalRowIdx] || { status: 'pending', logs: [] };
              
              if (!selectedRowForLogs) return null;
              
              const handleCopyLogs = () => {
                const logsText = selectedRowLogsObj.logs.map(l => `[${l.timestamp}] ${l.msg}`).join('\n');
                navigator.clipboard.writeText(logsText);
                showToast('Logs copiados para a área de transferência.');
              };
              
              return (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl animate-fade-in"
                >
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--border-color)]/10">
                    <div className="flex items-center gap-2">
                      <Terminal size={16} className="text-[#fab387]" />
                      <h3 className="font-bold text-sm text-[var(--text-main)]">
                        Log de Execução — Chamado #{logModalRowIdx}
                      </h3>
                    </div>
                    <button
                      onClick={() => setLogModalRowIdx(null)}
                      className="p-1 rounded text-gray-400 hover:text-[var(--text-main)] hover:bg-[#313244] transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Ticket Details summary */}
                  <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--border-color)]/5 grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--status-text)] uppercase block">Cliente</span>
                      <span className="font-semibold text-[var(--text-main)]">{selectedRowForLogs.cliente || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--status-text)] uppercase block">Catálogo</span>
                      <span className="font-semibold text-[var(--text-main)]">{selectedRowForLogs.catalogo || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold text-[var(--status-text)] uppercase block">Assunto</span>
                      <span className="font-semibold text-[var(--text-main)]">{selectedRowForLogs.assunto || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--status-text)] uppercase block">Fila GLPI</span>
                      <span className="font-semibold text-[var(--text-main)]">{selectedRowForLogs.fila || 'Fila Padrão'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--status-text)] uppercase block">Status de Execução</span>
                      <span className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full 
                          ${selectedRowLogsObj.status === 'success' ? 'bg-[#a6e3a1]' : ''}
                          ${selectedRowLogsObj.status === 'error' ? 'bg-[#f38ba8]' : ''}
                          ${selectedRowLogsObj.status === 'running' ? 'bg-[#f9e2af] animate-pulse' : ''}
                          ${selectedRowLogsObj.status === 'pending' ? 'bg-[#89b4fa] animate-pulse' : ''}
                        `} />
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                          {selectedRowLogsObj.status === 'pending' && 'Aguardando'}
                          {selectedRowLogsObj.status === 'running' && 'Executando'}
                          {selectedRowLogsObj.status === 'success' && 'Sucesso'}
                          {selectedRowLogsObj.status === 'error' && 'Falha'}
                          {selectedRowLogsObj.status === 'cancelled' && 'Cancelado'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Terminal Console */}
                  <div className="flex-1 bg-[var(--log-bg)] p-5 min-h-[250px] max-h-[350px] overflow-y-auto font-mono text-xs select-text border-b border-[var(--border-color)]">
                    {selectedRowLogsObj.logs.length === 0 ? (
                      <span className="text-[var(--status-text)] italic">Nenhum log gerado para este chamado ainda. Inicie a execução da tabela para ver o progresso real-time.</span>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedRowLogsObj.logs.map((log) => (
                          <div 
                            key={log.id} 
                            className={`flex gap-2 leading-relaxed
                              ${log.nivel === 'system' ? 'text-[var(--log-sys)] italic' : ''}
                              ${log.nivel === 'warning' ? 'text-[var(--log-warn)]' : ''}
                              ${log.nivel === 'error' ? 'text-[var(--log-err)] font-bold' : ''}
                              ${log.nivel === 'info' ? 'text-[var(--log-info)]' : ''}
                            `}
                          >
                            <span className="text-[var(--status-text)] shrink-0 select-none">[{log.timestamp}]</span>
                            <span>{log.msg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="px-6 py-4 bg-[var(--border-color)]/5 flex items-center justify-between">
                    <button
                      onClick={handleCopyLogs}
                      disabled={selectedRowLogsObj.logs.length === 0}
                      className="px-3 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:brightness-105 text-xs font-semibold transition disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Copiar Logs
                    </button>
                    <button
                      onClick={() => setLogModalRowIdx(null)}
                      className="px-4 py-1.5 rounded bg-[#89b4fa]/10 text-[#89b4fa] hover:bg-[#89b4fa]/20 border border-[#89b4fa]/20 text-xs font-bold transition"
                    >
                      Fechar
                    </button>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Log de Execução Geral (Console) ── */}
      <AnimatePresence>
        {modalGlobalLogsOpen && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[150] px-4 backdrop-blur-xs select-text">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--border-color)]/10">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-[#89b4fa]" />
                  <h3 className="font-bold text-sm text-[var(--text-main)]">
                    Console de Execução Geral
                  </h3>
                </div>
                <button
                  onClick={() => setModalGlobalLogsOpen(false)}
                  className="p-1 rounded text-gray-400 hover:text-[var(--text-main)] hover:bg-[#313244] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status Section */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--border-color)]/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[var(--status-text)] uppercase block">Status da Operação</span>
                  <span className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full 
                      ${jobStatus === 'done' ? 'bg-[#a6e3a1]' : ''}
                      ${jobStatus === 'error' ? 'bg-[#f38ba8]' : ''}
                      ${jobStatus === 'running' ? 'bg-[#f9e2af] animate-pulse' : ''}
                      ${jobStatus === 'idle' ? 'bg-gray-500' : ''}
                      ${jobStatus === 'cancelled' ? 'bg-gray-400' : ''}
                    `} />
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      {jobStatus === 'idle' && 'Aguardando'}
                      {jobStatus === 'running' && 'Executando'}
                      {jobStatus === 'done' && 'Sucesso'}
                      {jobStatus === 'error' && 'Falha'}
                      {jobStatus === 'cancelled' && 'Cancelado'}
                    </span>
                  </span>
                </div>
                {logs.length > 0 && (
                  <span className="text-[10px] font-bold text-[var(--status-text)] uppercase block text-right">
                    Total de Eventos: <span className="text-[var(--text-main)]">{logs.length}</span>
                  </span>
                )}
              </div>

              {/* Terminal Logs List */}
              <div className="flex-1 bg-[var(--log-bg)] p-5 min-h-[300px] max-h-[400px] overflow-y-auto font-mono text-xs select-text border-b border-[var(--border-color)]">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--status-text)]">
                    <ScrollText size={32} className="opacity-40 mb-3" />
                    <span className="italic">Nenhum log gerado para a execução atual.</span>
                    <span className="text-[10px] mt-1 max-w-sm">Adicione chamados, selecione-os e clique em &quot;Executar&quot; para iniciar o processamento e ver as etapas detalhadas de comunicação com a API do GLPI.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`flex gap-2 leading-relaxed
                          ${log.nivel === 'system' ? 'text-[var(--log-sys)] italic' : ''}
                          ${log.nivel === 'warning' ? 'text-[var(--log-warn)]' : ''}
                          ${log.nivel === 'error' ? 'text-[var(--log-err)] font-bold' : ''}
                          ${log.nivel === 'info' ? 'text-[var(--log-info)]' : ''}
                        `}
                      >
                        <span>{log.msg}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-[var(--border-color)]/5 flex items-center justify-between">
                <button
                  onClick={() => {
                    const logsText = logs.map(l => l.msg).join('\n');
                    navigator.clipboard.writeText(logsText);
                    showToast('Logs copiados para a área de transferência.');
                  }}
                  disabled={logs.length === 0}
                  className="px-3 py-1.5 rounded bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-text)] hover:brightness-105 text-xs font-semibold transition disabled:opacity-50 disabled:pointer-events-none"
                >
                  Copiar Logs
                </button>
                <button
                  onClick={() => setModalGlobalLogsOpen(false)}
                  className="px-4 py-1.5 rounded bg-[#89b4fa]/10 text-[#89b4fa] hover:bg-[#89b4fa]/20 border border-[#89b4fa]/20 text-xs font-bold transition"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Botão Flutuante: Assistente Gemini ── */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 left-6 z-[90] p-3.5 rounded-full bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-2xl transition hover:scale-110 hover:brightness-105 active:scale-95 flex items-center gap-2 group border border-violet-500/30 font-bold text-xs cursor-pointer select-none"
        title="Abrir Assistente de TI Gemini"
      >
        <Bot size={18} className="animate-bounce" style={{ animationDuration: '3s' }} />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 ease-out font-semibold tracking-wide whitespace-nowrap">
          Assistente Gemini
        </span>
      </button>

      {/* ── Painel Drawer: Chat do Assistente Gemini ── */}
      <AnimatePresence>
        {chatOpen && (
          <>
            {/* Backdrop for mobile */}
            <div 
              className="fixed inset-0 bg-black/60 z-[110] md:hidden backdrop-blur-xs"
              onClick={() => setChatOpen(false)}
            />
            
            <motion.div
              initial={{ x: '100%', opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[var(--modal-bg)] border-l border-[var(--border-color)] shadow-2xl z-[120] flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-violet-600 to-sky-600 text-white shadow-md">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-main)] leading-none">Assistente Gemini</h3>
                    <span className="text-[10px] text-[#a6e3a1] font-medium block mt-1">● Online • Pronto para ajudar</span>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="p-1 rounded hover:bg-[var(--border-color)]/50 text-[var(--status-text)] hover:text-[var(--text-main)] transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Message Box */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-body)] select-text">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <span className="text-[9px] text-[var(--status-text)] font-semibold uppercase tracking-wider mb-1 px-1">
                      {msg.role === 'user' ? 'Você' : 'Gemini'}
                    </span>
                    <div 
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-[#89b4fa] text-[#1e1e2e] font-medium rounded-tr-none shadow-md' 
                          : 'bg-[#313244]/80 text-[var(--text-main)] border border-[var(--border-color)]/50 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line font-sans">{msg.content}</p>

                      {msg.role === 'assistant' && index > 0 && (
                        <button
                          onClick={() => handleCreateTicketFromChat(msg.content)}
                          className="mt-2.5 px-2.5 py-1 bg-gradient-to-r from-violet-600/20 to-sky-600/20 hover:from-violet-600/30 hover:to-sky-600/30 border border-violet-500/30 text-[10px] font-bold text-violet-300 rounded-md transition flex items-center gap-1 cursor-pointer select-none"
                          title="Adiciona o conteúdo deste diagnóstico como uma nova linha na tabela"
                        >
                          <Plus size={11} />
                          <span>Gerar Chamado desta Resposta</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {isChatSending && (
                  <div className="flex flex-col items-start max-w-[85%] mr-auto">
                    <span className="text-[9px] text-[var(--status-text)] font-semibold uppercase tracking-wider mb-1 px-1">
                      Gemini
                    </span>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-[#313244]/50 border border-[var(--border-color)]/30 flex items-center gap-2 text-xs text-[var(--status-text)]">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="font-mono text-[10px]">Analisando...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-header)]">
                <div className="flex items-center gap-2">
                  <textarea
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    placeholder="Como posso te ajudar hoje?"
                    className="flex-1 bg-[var(--modal-input-bg)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] outline-none focus:border-violet-500/50 resize-none max-h-24 font-sans leading-relaxed"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={isChatSending || !chatInput.trim()}
                    className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-sky-600 text-white hover:brightness-115 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-violet-500/10"
                  >
                    <Send size={15} />
                  </button>
                </div>
                <div className="text-[9px] text-[var(--status-text)] text-center mt-2 font-mono">
                  Alimentado por Gemini 3.5 Flash • Respostas Inteligentes
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast Element ── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-[var(--toast-bg)] border border-[var(--border-color)] text-xs font-semibold text-[var(--toast-text)] shadow-2xl flex items-center gap-2 z-[200]"
          >
            <Check size={14} className="text-[#a6e3a1]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
export const dynamic = 'force-dynamic';
