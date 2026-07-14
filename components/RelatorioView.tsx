'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, Users, CheckCircle2, AlertTriangle, Clock, 
  Search, Shield, Lock, FileText, ArrowUpDown, ChevronDown, 
  ChevronUp, RefreshCw, Eye, EyeOff, Ban, Download, Filter, FileSpreadsheet
} from 'lucide-react';

interface HistoryTicket {
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

interface RelatorioViewProps {
  userEmail: string;
  userRole: 'admin' | 'tecnico';
  openEditProfile?: () => void;
}

// Simple date parser helper
function parsePtBrDate(dateStr: string): Date {
  try {
    const [datePart, timePart] = dateStr.split(/[,\s]+/);
    const [day, month, year] = datePart.split('/').map(Number);
    if (timePart) {
      const [hour, minute, second] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute, second || 0);
    }
    return new Date(year, month - 1, day);
  } catch (e) {
    return new Date(dateStr);
  }
}

export default function RelatorioView({ userEmail, userRole, openEditProfile }: RelatorioViewProps) {
  const [tickets, setTickets] = useState<HistoryTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters State
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedQueue, setSelectedQueue] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDemandType, setSelectedDemandType] = useState('all');
  const [selectedTechnician, setSelectedTechnician] = useState('all');

  // Expanded row state (for detailed tickets)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Fetch ticket history
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/historico');
      if (r.ok) {
        const data = await r.json();
        setTickets(data || []);
      }
    } catch (e) {
      console.error('Error fetching ticket history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      fetchHistory();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Extract filter options dynamically from history
  const filterOptions = useMemo(() => {
    const clients = new Set<string>();
    const queues = new Set<string>();
    const demandTypes = new Set<string>();
    const technicians = new Set<string>();

    tickets.forEach(t => {
      if (t.cliente) clients.add(t.cliente);
      if (t.fila) queues.add(t.fila);
      if (t.tipo_demanda) demandTypes.add(t.tipo_demanda);
      if (t.tecnico) technicians.add(t.tecnico);
    });

    return {
      clients: Array.from(clients).sort(),
      queues: Array.from(queues).sort(),
      demandTypes: Array.from(demandTypes).sort(),
      technicians: Array.from(technicians).sort()
    };
  }, [tickets]);

  // Filter tickets based on criteria
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Search query (filters by ID, user, client, catalog, subject if admin)
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesBasic = 
          (ticket.id && ticket.id.toLowerCase().includes(query)) ||
          (ticket.glpi_id && ticket.glpi_id.toLowerCase().includes(query)) ||
          (ticket.cliente && ticket.cliente.toLowerCase().includes(query)) ||
          (ticket.catalogo && ticket.catalogo.toLowerCase().includes(query)) ||
          (ticket.nome_usuario && ticket.nome_usuario.toLowerCase().includes(query)) ||
          (ticket.email_usuario && ticket.email_usuario.toLowerCase().includes(query)) ||
          (ticket.fila && ticket.fila.toLowerCase().includes(query));
        
        const matchesAdmin = userRole === 'admin' && (
          (ticket.assunto && ticket.assunto.toLowerCase().includes(query)) ||
          (ticket.descricao && ticket.descricao.toLowerCase().includes(query)) ||
          (ticket.detalhes && ticket.detalhes.toLowerCase().includes(query)) ||
          (ticket.resolucao && ticket.resolucao.toLowerCase().includes(query))
        );

        if (!matchesBasic && !matchesAdmin) return false;
      }

      // Client filter
      if (selectedClient !== 'all' && ticket.cliente !== selectedClient) return false;

      // Queue filter
      if (selectedQueue !== 'all' && ticket.fila !== selectedQueue) return false;

      // Status filter
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) return false;

      // Demand Type filter
      if (selectedDemandType !== 'all' && ticket.tipo_demanda !== selectedDemandType) return false;

      // Technician filter
      if (selectedTechnician !== 'all' && ticket.tecnico !== selectedTechnician) return false;

      // Date range filter
      if (dateRangePreset !== 'all') {
        const ticketDate = parsePtBrDate(ticket.data);
        const now = new Date();

        if (dateRangePreset === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (ticketDate < today) return false;
        } else if (dateRangePreset === '7days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (ticketDate < sevenDaysAgo) return false;
        } else if (dateRangePreset === '30days') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (ticketDate < thirtyDaysAgo) return false;
        } else if (dateRangePreset === 'custom') {
          if (startDate) {
            const start = new Date(startDate);
            // Set start of day
            start.setHours(0, 0, 0, 0);
            if (ticketDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            // Set end of day
            end.setHours(23, 59, 59, 999);
            if (ticketDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [tickets, searchQuery, selectedClient, selectedQueue, selectedStatus, selectedDemandType, selectedTechnician, dateRangePreset, startDate, endDate, userRole]);

  // Calculations for Dashboard Metrics (KPIs)
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const ok = filteredTickets.filter(t => t.status === 'OK').length;
    const erro = filteredTickets.filter(t => t.status === 'ERRO').length;
    const successRate = total > 0 ? Math.round((ok / total) * 100) : 0;
    
    // Average processing time estimation (e.g. we assume each successful ticket saves 12 minutes of manual GLPI creation)
    const timeSavedMinutes = ok * 12;
    const hours = Math.floor(timeSavedMinutes / 60);
    const minutes = timeSavedMinutes % 60;
    const timeSavedFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return { total, ok, erro, successRate, timeSavedFormatted };
  }, [filteredTickets]);

  // Charts data aggregations
  const chartsData = useMemo(() => {
    // 1. Processing status over time (by day)
    const dayMap: Record<string, { dateLabel: string, timestamp: number, OK: number, ERRO: number, Total: number }> = {};
    
    filteredTickets.forEach(t => {
      const parsedDate = parsePtBrDate(t.data);
      // Format day as DD/MM
      const dayStr = parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      // We also keep track of actual day timestamp to sort properly
      const startOfDayTimestamp = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()).getTime();

      if (!dayMap[dayStr]) {
        dayMap[dayStr] = {
          dateLabel: dayStr,
          timestamp: startOfDayTimestamp,
          OK: 0,
          ERRO: 0,
          Total: 0
        };
      }
      dayMap[dayStr][t.status]++;
      dayMap[dayStr].Total++;
    });

    // Sort days chronologically
    const dailyData = Object.values(dayMap).sort((a, b) => a.timestamp - b.timestamp);

    // 2. Status Distribution Pie
    const statusData = [
      { name: 'Sucesso (OK)', value: stats.ok, color: '#a6e3a1' },
      { name: 'Falha (ERRO)', value: stats.erro, color: '#f38ba8' }
    ].filter(item => item.value > 0);

    // 3. Client Distribution
    const clientMap: Record<string, { name: string, OK: number, ERRO: number, Total: number }> = {};
    filteredTickets.forEach(t => {
      const client = t.cliente || 'Sem Cliente';
      if (!clientMap[client]) {
        clientMap[client] = { name: client, OK: 0, ERRO: 0, Total: 0 };
      }
      clientMap[client][t.status]++;
      clientMap[client].Total++;
    });
    const clientData = Object.values(clientMap)
      .sort((a, b) => b.Total - a.Total)
      .slice(0, 10); // top 10

    // 4. Queue Distribution
    const queueMap: Record<string, { name: string, OK: number, ERRO: number, Total: number }> = {};
    filteredTickets.forEach(t => {
      const queue = t.fila || 'Sem Fila';
      if (!queueMap[queue]) {
        queueMap[queue] = { name: queue, OK: 0, ERRO: 0, Total: 0 };
      }
      queueMap[queue][t.status]++;
      queueMap[queue].Total++;
    });
    const queueData = Object.values(queueMap)
      .sort((a, b) => b.Total - a.Total)
      .slice(0, 10);

    return { dailyData, statusData, clientData, queueData };
  }, [filteredTickets, stats]);

  // Export filtered items to CSV
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) return;
    
    // Headers list
    const headers = [
      'ID', 'Data', 'Status', 'Cliente', 'Fila', 'Catalogo', 'Tipo Demanda', 'Urgencia'
    ];
    if (userRole === 'admin') {
      headers.push('Nome Usuario', 'Email Usuario', 'Celular', 'Assunto', 'Descricao', 'Resolucao', 'Erros/Detalhes');
    }

    const csvRows = [
      headers.join(';') // CSV header row
    ];

    filteredTickets.forEach(t => {
      const row = [
        t.id,
        t.data,
        t.status,
        `"${(t.cliente || '').replace(/"/g, '""')}"`,
        `"${(t.fila || '').replace(/"/g, '""')}"`,
        `"${(t.catalogo || '').replace(/"/g, '""')}"`,
        `"${(t.tipo_demanda || '').replace(/"/g, '""')}"`,
        `"${(t.urgencia || '').replace(/"/g, '""')}"`
      ];

      if (userRole === 'admin') {
        row.push(
          `"${(t.nome_usuario || '').replace(/"/g, '""')}"`,
          `"${(t.email_usuario || '').replace(/"/g, '""')}"`,
          `"${(t.celular || '').replace(/"/g, '""')}"`,
          `"${(t.assunto || '').replace(/"/g, '""')}"`,
          `"${(t.descricao || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${(t.resolucao || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          `"${(t.detalhes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        );
      }

      csvRows.push(row.join(';'));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_chamados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="relatorios_main_container" className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[var(--bg-body)]">
      
      {/* View Header */}
      <div className="bg-[var(--bg-header)] border-b border-[var(--border-color)]/30 px-6 py-4 flex items-center justify-between shrink-0 select-none">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-[#a6e3a1]" />
            <span>Relatório Analítico de Chamados</span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${userRole === 'admin' ? 'bg-[#f38ba8]/15 text-[#f38ba8]' : 'bg-[#a6e3a1]/15 text-[#a6e3a1]'}`}>
              {userRole === 'admin' ? 'ADMIN (VISÃO TOTAL)' : 'TÉCNICO (VISÃO QUANTITATIVA)'}
            </span>
          </h2>
          <p className="text-[10px] text-[var(--status-text)] mt-0.5">
            Estatísticas, produtividade, volumes de atendimento e acompanhamento de chamados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-1.5 hover:bg-[var(--border-color)]/40 rounded text-gray-400 hover:text-[var(--text-main)] transition cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={filteredTickets.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[var(--border-color)] border border-[var(--border-color)]/50 hover:bg-[var(--border-color)]/70 text-[var(--text-main)] text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Exportar dados visíveis para CSV"
          >
            <Download size={13} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Primary Scroll Window */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin">
        
        {/* Filters Panel */}
        <div className="bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-4 flex flex-col gap-4 shadow-sm select-none">
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/10 pb-2">
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
              <Filter size={13} className="text-[#89b4fa]" /> Filtros de Relatório
            </span>
            {searchQuery || selectedClient !== 'all' || selectedQueue !== 'all' || selectedStatus !== 'all' || dateRangePreset !== 'all' || selectedDemandType !== 'all' || selectedTechnician !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedClient('all');
                  setSelectedQueue('all');
                  setSelectedStatus('all');
                  setSelectedDemandType('all');
                  setSelectedTechnician('all');
                  setDateRangePreset('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[10px] text-[#f38ba8] hover:underline font-semibold cursor-pointer"
              >
                Limpar Todos Filtros
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {/* Search Input */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] font-semibold text-[var(--status-text)]">Termo de busca</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--status-text)]/70" size={12} />
                <input
                  type="text"
                  placeholder={userRole === 'admin' ? "Buscar ID, Cliente, Fila, Assunto, Técnico..." : "Buscar ID, Cliente, Fila..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-main)] outline-none focus:border-[#89b4fa]/40 transition"
                />
              </div>
            </div>

            {/* Client Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--status-text)]">Cliente</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none cursor-pointer focus:border-[#89b4fa]/40 transition"
              >
                <option value="all">Todos os Clientes</option>
                {filterOptions.clients.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Queue Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--status-text)]">Fila de Atendimento</label>
              <select
                value={selectedQueue}
                onChange={(e) => setSelectedQueue(e.target.value)}
                className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none cursor-pointer focus:border-[#89b4fa]/40 transition"
              >
                <option value="all">Todas as Filas</option>
                {filterOptions.queues.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--status-text)]">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none cursor-pointer focus:border-[#89b4fa]/40 transition"
              >
                <option value="all">Todos os Status</option>
                <option value="OK">Sucesso (OK)</option>
                <option value="ERRO">Falha (ERRO)</option>
              </select>
            </div>

            {/* Period Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--status-text)]">Período de Execução</label>
              <select
                value={dateRangePreset}
                onChange={(e) => setDateRangePreset(e.target.value as any)}
                className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none cursor-pointer focus:border-[#89b4fa]/40 transition"
              >
                <option value="all">Todo Histórico</option>
                <option value="today">Hoje</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="custom">Personalizado (Data)</option>
              </select>
            </div>

            {/* Demand Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--status-text)]">Tipo de Demanda</label>
              <select
                value={selectedDemandType}
                onChange={(e) => setSelectedDemandType(e.target.value)}
                className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none cursor-pointer focus:border-[#89b4fa]/40 transition"
              >
                <option value="all">Todos os Tipos</option>
                {filterOptions.demandTypes.map(dt => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            </div>

            {/* Technician Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-[var(--status-text)]">Técnico</label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none cursor-pointer focus:border-[#89b4fa]/40 transition"
              >
                <option value="all">Todos os Técnicos</option>
                {filterOptions.technicians.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>

            {/* Custom Dates (visible if "custom" selected) */}
            {dateRangePreset === 'custom' && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--status-text)]">De</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[var(--status-text)]">Até</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[var(--bg-body)] border border-[var(--border-color)]/40 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-main)] outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
          
          {/* Card 1: Total Chamados */}
          <div className="bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-[var(--border-color)]/40 transition">
            <div className="p-3 bg-[#89b4fa]/10 text-[#89b4fa] rounded-xl">
              <FileText size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--status-text)] font-semibold uppercase tracking-wider">Volume Total</span>
              <span className="text-xl font-bold text-[var(--text-main)] mt-0.5 leading-none">{stats.total}</span>
              <span className="text-[9px] text-[var(--status-text)] mt-1">chamados filtrados</span>
            </div>
          </div>

          {/* Card 2: Sucesso */}
          <div className="bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-[var(--border-color)]/40 transition">
            <div className="p-3 bg-[#a6e3a1]/10 text-[#a6e3a1] rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--status-text)] font-semibold uppercase tracking-wider">OK (Sucesso)</span>
              <span className="text-xl font-bold text-[#a6e3a1] mt-0.5 leading-none">
                {stats.ok} <span className="text-xs font-semibold text-[var(--status-text)]">({stats.successRate}%)</span>
              </span>
              <span className="text-[9px] text-[var(--status-text)] mt-1">processados no GLPI</span>
            </div>
          </div>

          {/* Card 3: Erros */}
          <div className="bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-[var(--border-color)]/40 transition">
            <div className="p-3 bg-[#f38ba8]/10 text-[#f38ba8] rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--status-text)] font-semibold uppercase tracking-wider">ERRO (Falha)</span>
              <span className="text-xl font-bold text-[#f38ba8] mt-0.5 leading-none">
                {stats.erro} <span className="text-xs font-semibold text-[var(--status-text)]">({stats.total > 0 ? 100 - stats.successRate : 0}%)</span>
              </span>
              <span className="text-[9px] text-[var(--status-text)] mt-1">com falha no envio</span>
            </div>
          </div>

          {/* Card 4: Tempo Economizado */}
          <div className="bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:border-[var(--border-color)]/40 transition">
            <div className="p-3 bg-[#f9e2af]/10 text-[#f9e2af] rounded-xl">
              <Clock size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--status-text)] font-semibold uppercase tracking-wider">Tempo Poupado</span>
              <span className="text-xl font-bold text-[#f9e2af] mt-0.5 leading-none">{stats.timeSavedFormatted}</span>
              <span className="text-[9px] text-[var(--status-text)] mt-1">de trabalho operacional</span>
            </div>
          </div>

        </div>

        {/* Charts Panel */}
        {isMounted && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: Volume diário (Line/Bar) */}
            <div className="lg:col-span-8 bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h3 className="text-xs font-bold text-[var(--text-main)]">Chamados por Dia</h3>
                  <span className="text-[9px] text-[var(--status-text)]">Evolução de sucessos (OK) e falhas (ERRO) no período</span>
                </div>
              </div>
              <div className="h-64 w-full">
                {chartsData.dailyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[var(--status-text)] text-xs italic bg-[var(--bg-body)]/20 border border-dashed border-[var(--border-color)]/30 rounded-lg">
                    Nenhum dado de histórico para o período selecionado
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                      <XAxis dataKey="dateLabel" stroke="var(--status-text)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--status-text)" fontSize={10} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--modal-bg)', 
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          fontSize: '11px'
                        }} 
                      />
                      <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="OK" name="Sucesso (OK)" fill="#a6e3a1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="ERRO" name="Falha (ERRO)" fill="#f38ba8" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Status Pie Distribution */}
            <div className="lg:col-span-4 bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col mb-4">
                <h3 className="text-xs font-bold text-[var(--text-main)]">Aproveitamento</h3>
                <span className="text-[9px] text-[var(--status-text)]">Taxa de assertividade das automatizações</span>
              </div>
              <div className="h-64 w-full flex flex-col items-center justify-center">
                {chartsData.statusData.length === 0 ? (
                  <div className="h-full w-full flex items-center justify-center text-[var(--status-text)] text-xs italic bg-[var(--bg-body)]/20 border border-dashed border-[var(--border-color)]/30 rounded-lg">
                    Sem dados de status
                  </div>
                ) : (
                  <>
                    <div className="h-44 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartsData.statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {chartsData.statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--modal-bg)', 
                              borderColor: 'var(--border-color)',
                              borderRadius: '8px',
                              color: 'var(--text-main)',
                              fontSize: '11px'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <span className="text-xl font-bold text-[var(--text-main)] leading-none">{stats.successRate}%</span>
                        <span className="text-[8px] text-[var(--status-text)] mt-1 font-semibold uppercase tracking-wider">Sucesso</span>
                      </div>
                    </div>
                    {/* Pie Legend custom */}
                    <div className="flex gap-4 mt-3 text-[10px] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#a6e3a1]" />
                        <span className="text-[var(--text-main)]">OK: {stats.ok}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f38ba8]" />
                        <span className="text-[var(--text-main)]">ERRO: {stats.erro}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chart 3: Chamados por Cliente (Top 10) */}
            <div className="lg:col-span-6 bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col mb-4">
                <h3 className="text-xs font-bold text-[var(--text-main)]">Volumetria por Cliente</h3>
                <span className="text-[9px] text-[var(--status-text)]">Top 10 clientes com maior volume de chamados processados</span>
              </div>
              <div className="h-64 w-full">
                {chartsData.clientData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[var(--status-text)] text-xs italic bg-[var(--bg-body)]/20 border border-dashed border-[var(--border-color)]/30 rounded-lg">
                    Sem dados de clientes
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.clientData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.2} horizontal={false} />
                      <XAxis type="number" stroke="var(--status-text)" fontSize={10} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke="var(--status-text)" fontSize={9} tickLine={false} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--modal-bg)', 
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          fontSize: '11px'
                        }} 
                      />
                      <Bar dataKey="Total" name="Total Chamados" fill="#89b4fa" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 4: Chamados por Fila (Top 10) */}
            <div className="lg:col-span-6 bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col mb-4">
                <h3 className="text-xs font-bold text-[var(--text-main)]">Volumetria por Fila de Atendimento</h3>
                <span className="text-[9px] text-[var(--status-text)]">Carga de chamados distribuída por filas/setores</span>
              </div>
              <div className="h-64 w-full">
                {chartsData.queueData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[var(--status-text)] text-xs italic bg-[var(--bg-body)]/20 border border-dashed border-[var(--border-color)]/30 rounded-lg">
                    Sem dados de filas
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.queueData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.2} horizontal={false} />
                      <XAxis type="number" stroke="var(--status-text)" fontSize={10} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke="var(--status-text)" fontSize={9} tickLine={false} width={80} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--modal-bg)', 
                          borderColor: 'var(--border-color)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          fontSize: '11px'
                        }} 
                      />
                      <Bar dataKey="Total" name="Total Chamados" fill="#f9e2af" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Tickets Breakdown Table & Details */}
        <div className="bg-[var(--bg-toolbar)] border border-[var(--border-color)]/20 rounded-xl overflow-hidden shadow-sm flex flex-col">
          
          {/* Table Header Section */}
          <div className="px-6 py-4 border-b border-[var(--border-color)]/20 flex items-center justify-between select-none">
            <div className="flex flex-col">
              <h3 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <span>Lista Analítica de Chamados</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--border-color)] text-[10px] text-[var(--text-main)] font-semibold">
                  {filteredTickets.length} registros
                </span>
              </h3>
              <span className="text-[9px] text-[var(--status-text)]">
                {userRole === 'admin' 
                  ? 'Acesso irrestrito a todos os dados descritivos, logs, resoluções e arquivos'
                  : 'Acesso às estatísticas quantitativas. Campos de texto descritivo protegidos por perfil'
                }
              </span>
            </div>
            {userRole !== 'admin' && openEditProfile && (
              <button 
                onClick={openEditProfile}
                className="text-[10px] text-[#89b4fa] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Shield size={11} /> Simular Administrador para Ver Descrições
              </button>
            )}
          </div>

          {/* Actual Table */}
          <div className="overflow-x-auto">
            {filteredTickets.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center p-6">
                <div className="w-10 h-10 rounded-full bg-[var(--border-color)]/20 text-[var(--status-text)] flex items-center justify-center mb-3">
                  <Filter size={18} />
                </div>
                <p className="text-xs font-semibold text-[var(--text-main)]">Nenhum chamado corresponde aos filtros</p>
                <p className="text-[10px] text-[var(--status-text)] mt-1 max-w-xs">
                  Modifique os termos de busca ou filtros de cliente, fila e datas para localizar os registros.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--border-color)]/10 text-[10px] font-bold text-[var(--status-text)] uppercase tracking-wider select-none border-b border-[var(--border-color)]/20">
                    <th className="px-4 py-3 text-center w-12">Expandir</th>
                    <th className="px-4 py-3">Código/ID</th>
                    <th className="px-4 py-3">Data/Hora</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Fila de Atendimento</th>
                    <th className="px-4 py-3">Tipo Demanda</th>
                    <th className="px-4 py-3">Assunto Resumido</th>
                    <th className="px-4 py-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/15">
                  {filteredTickets.map((ticket) => {
                    const isExpanded = !!expandedRows[ticket.id];
                    const isOk = ticket.status === 'OK';
                    return (
                      <React.Fragment key={ticket.id}>
                        {/* Primary Row */}
                        <tr 
                          className="hover:bg-[var(--border-color)]/10 transition-colors cursor-pointer group"
                          onClick={() => toggleRow(ticket.id)}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => { e.stopPropagation(); toggleRow(ticket.id); }}>
                            <button className="p-1 rounded hover:bg-[var(--border-color)]/30 text-[var(--status-text)] transition">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[var(--text-main)] whitespace-nowrap">
                            {ticket.id}
                          </td>
                          <td className="px-4 py-3 text-[var(--status-text)] whitespace-nowrap">
                            {ticket.data}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[var(--text-main)] whitespace-nowrap">
                            {ticket.cliente || <span className="opacity-40 font-normal italic">N/A</span>}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-main)] whitespace-nowrap">
                            {ticket.fila ? (
                              <span className="px-2 py-0.5 rounded bg-[var(--border-color)]/50 border border-[var(--border-color)]/30 font-semibold text-[10px]">
                                {ticket.fila}
                              </span>
                            ) : (
                              <span className="opacity-40 italic">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[var(--status-text)] whitespace-nowrap">
                            {ticket.tipo_demanda || <span className="opacity-40 italic">N/A</span>}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-main)] font-medium max-w-[200px] truncate">
                            {userRole === 'admin' ? (
                              ticket.assunto || ticket.original_assunto || <span className="opacity-40 italic">Sem assunto</span>
                            ) : (
                              <span className="text-[var(--status-text)] flex items-center gap-1 italic text-[11px]">
                                <Lock size={10} className="text-[#f38ba8]/70" /> Restrito (Apenas Admin)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              isOk 
                                ? 'bg-[#a6e3a1]/15 border border-[#a6e3a1]/30 text-[#a6e3a1]' 
                                : 'bg-[#f38ba8]/15 border border-[#f38ba8]/30 text-[#f38ba8]'
                            }`}>
                              {ticket.status}
                            </span>
                          </td>
                        </tr>

                        {/* Collapsible Detail Row */}
                        {isExpanded && (
                          <tr className="bg-[var(--border-color)]/5 border-l-2 border-l-[#89b4fa]">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                
                                {/* Block 1: Basic & Context Data (Visible to Everyone) */}
                                <div className="flex flex-col gap-3 bg-[var(--bg-toolbar)]/60 border border-[var(--border-color)]/20 rounded-xl p-4">
                                  <h4 className="text-[10px] font-extrabold uppercase text-[#89b4fa] tracking-wider border-b border-[var(--border-color)]/20 pb-1 flex items-center gap-1.5">
                                    <FileText size={12} /> Informações Básicas (Quantitativas)
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <span className="text-[10px] text-[var(--status-text)] block">Identificador GLPI</span>
                                      <span className="font-semibold text-[var(--text-main)] font-mono">{ticket.glpi_id || 'Não integrado'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-[var(--status-text)] block">Urgência</span>
                                      <span className="font-semibold text-[var(--text-main)]">{ticket.urgencia || 'Não definida'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-[var(--status-text)] block">Catálogo de Serviços</span>
                                      <span className="font-semibold text-[var(--text-main)] text-[11px] block truncate" title={ticket.catalogo}>{ticket.catalogo || 'Sem catálogo'}</span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-[var(--status-text)] block">Data/Hora Log</span>
                                      <span className="font-semibold text-[var(--text-main)]">{ticket.data}</span>
                                    </div>
                                  </div>
                                  {ticket.arquivo_nome_exibicao && (
                                    <div className="mt-2 pt-2 border-t border-[var(--border-color)]/10">
                                      <span className="text-[10px] text-[var(--status-text)] block mb-1">Anexo Enviado</span>
                                      <div className="flex items-center gap-1.5 p-1.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]/30 max-w-xs">
                                        <div className="p-1 bg-[#a6e3a1]/10 rounded text-[#a6e3a1]">
                                          <FileText size={12} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <span className="text-[10px] font-semibold text-[var(--text-main)] block truncate">{ticket.arquivo_nome_exibicao}</span>
                                          <span className="text-[8px] text-[var(--status-text)] block">{ticket.arquivo_tamanhos || 'Tamanho desconhecido'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Block 2: Sensitive Descriptive Data (Restricted to Admin) */}
                                <div className="flex flex-col gap-3 bg-[var(--bg-toolbar)]/60 border border-[var(--border-color)]/20 rounded-xl p-4">
                                  <h4 className="text-[10px] font-extrabold uppercase text-[#f38ba8] tracking-wider border-b border-[var(--border-color)]/20 pb-1 flex items-center gap-1.5">
                                    <Shield size={12} /> Descrições e Dados do Solicitante
                                  </h4>
                                  
                                  {userRole === 'admin' ? (
                                    <div className="flex flex-col gap-3">
                                      {/* Solicitante metadata */}
                                      <div className="grid grid-cols-2 gap-3 border-b border-[var(--border-color)]/10 pb-2">
                                        <div>
                                          <span className="text-[10px] text-[var(--status-text)] block">Nome Solicitante</span>
                                          <span className="font-semibold text-[var(--text-main)]">{ticket.nome_usuario || <span className="opacity-40 italic">Sem nome</span>}</span>
                                        </div>
                                        <div>
                                          <span className="text-[10px] text-[var(--status-text)] block">E-mail / Celular</span>
                                          <span className="font-semibold text-[var(--text-main)] font-mono text-[10px] block">
                                            {ticket.email_usuario || 'Sem e-mail'} <br/> {ticket.celular || 'Sem celular'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Subject and descriptions */}
                                      <div>
                                        <span className="text-[10px] text-[var(--status-text)] block mb-0.5">Assunto Completo</span>
                                        <p className="font-semibold text-[var(--text-main)] p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]/30">
                                          {ticket.assunto || <span className="opacity-40 italic font-normal">Nenhum</span>}
                                        </p>
                                      </div>

                                      <div>
                                        <span className="text-[10px] text-[var(--status-text)] block mb-0.5">Descrição do Chamado</span>
                                        <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]/30 font-mono text-[10px] whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed text-[var(--text-main)]">
                                          {ticket.descricao || <span className="opacity-40 italic font-normal">Sem descrição</span>}
                                        </div>
                                      </div>

                                      {ticket.resolucao && (
                                        <div>
                                          <span className="text-[10px] text-[var(--status-text)] block mb-0.5">Solução / Resolução Aplicada</span>
                                          <p className="p-2 bg-emerald-950/10 text-emerald-300 border border-emerald-500/20 rounded-lg text-[10px]">
                                            {ticket.resolucao}
                                          </p>
                                        </div>
                                      )}

                                      {ticket.detalhes && (
                                        <div>
                                          <span className="text-[10px] text-[var(--status-text)] block mb-0.5">Detalhes do Erro / Logs de Falha</span>
                                          <p className="p-2 bg-red-950/10 text-red-300 border border-red-500/20 rounded-lg text-[10px] font-mono whitespace-pre-wrap">
                                            {ticket.detalhes}
                                          </p>
                                        </div>
                                      )}

                                    </div>
                                  ) : (
                                    /* Restricted placeholder screen for non-admin */
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                      <div className="w-12 h-12 rounded-full bg-[#f38ba8]/10 text-[#f38ba8] flex items-center justify-center mb-3 border border-[#f38ba8]/20">
                                        <Lock size={18} />
                                      </div>
                                      <span className="text-xs font-bold text-[var(--text-main)]">Descrição Protegida por Perfil</span>
                                      <p className="text-[9px] text-[var(--status-text)] max-w-xs mt-1 leading-relaxed">
                                        De acordo com a diretriz do sistema, detalhes como assunto, e-mail de contato, celular, descrição original e logs de erro do chamado são visíveis apenas para <strong>Administradores</strong>.
                                      </p>
                                      {openEditProfile && (
                                        <button 
                                          onClick={openEditProfile}
                                          className="mt-3 px-3 py-1 bg-[#89b4fa]/10 text-[#89b4fa] border border-[#89b4fa]/20 rounded-lg text-[10px] font-bold transition hover:bg-[#89b4fa]/20 cursor-pointer"
                                        >
                                          Tornar-me Admin (Simular)
                                        </button>
                                      )}
                                    </div>
                                  )}

                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
