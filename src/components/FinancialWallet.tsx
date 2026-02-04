import { useState } from 'react'
import {
  Wallet,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  User,
  DollarSign,
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Receipt,
  Sparkles
} from 'lucide-react'

export interface Locacao {
  id: string
  equipamentoNome: string
  clienteNome: string
  valorTotal: number
  valorDiaria: number
  dataInicio: string
  dataFim: string
  diasLocacao: number
  status: 'em_andamento' | 'finalizada' | 'aguardando_pagamento'
  pago: boolean
  dataPagamento?: string
}

interface FinancialWalletProps {
  locacoes?: Locacao[]
  onMarcarPago?: (locacaoId: string, pago: boolean) => void
}

export function FinancialWallet({ locacoes, onMarcarPago }: FinancialWalletProps) {
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pagos' | 'pendentes'>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const dadosLocacoes = locacoes || []

  // Cálculos financeiros
  const totalRecebido = dadosLocacoes.filter(l => l.pago).reduce((acc, l) => acc + l.valorTotal, 0)
  const totalPendente = dadosLocacoes.filter(l => !l.pago).reduce((acc, l) => acc + l.valorTotal, 0)
  const totalGeral = dadosLocacoes.reduce((acc, l) => acc + l.valorTotal, 0)
  const locacoesEmAndamento = dadosLocacoes.filter(l => l.status === 'em_andamento').length
  const locacoesPendentes = dadosLocacoes.filter(l => !l.pago).length

  const filteredLocacoes = dadosLocacoes.filter(loc => {
    if (filterStatus === 'todos') return true
    if (filterStatus === 'pagos') return loc.pago
    if (filterStatus === 'pendentes') return !loc.pago
    return true
  })

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const getStatusBadge = (loc: Locacao) => {
    if (loc.pago) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          PAGO
        </span>
      )
    }
    if (loc.status === 'em_andamento') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
          <Clock className="w-3 h-3" />
          EM USO
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <Clock className="w-3 h-3" />
        PENDENTE
      </span>
    )
  }

  const handleTogglePago = (locacaoId: string, currentPago: boolean) => {
    if (onMarcarPago) {
      onMarcarPago(locacaoId, !currentPago)
    } else {
      // Mock local toggle for demo
      alert(`Locação ${locacaoId} marcada como ${!currentPago ? 'PAGO' : 'PENDENTE'}`)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Card Wallet Principal - Visão Geral de Lucros */}
      <div className="relative bg-slate-900 rounded-2xl p-5 sm:p-8 overflow-hidden">
        {/* Decorações de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600 rounded-full blur-[120px] opacity-30 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/4" />

        {/* Pattern decorativo */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Header do Card */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Meus Ganhos</p>
                <p className="text-white/40 text-[10px]">Controle Financeiro</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-bold">LOCADOR</span>
            </div>
          </div>

          {/* Grid de Valores */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Total Recebido */}
            <div className="min-w-0">
              <p className="text-emerald-400/70 text-xs font-medium mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> Recebido
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400 tracking-tight truncate">
                {formatCurrency(totalRecebido)}
              </p>
            </div>

            {/* Total Pendente */}
            <div className="min-w-0 text-right">
              <p className="text-amber-400/70 text-xs font-medium mb-1 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" /> A Receber
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-400 tracking-tight truncate">
                {formatCurrency(totalPendente)}
              </p>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white/50">Progresso de Pagamentos</span>
              <span className="text-white/70 font-bold">
                {totalGeral > 0 ? Math.round((totalRecebido / totalGeral) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${totalGeral > 0 ? (totalRecebido / totalGeral) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Stats Rápidos */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg flex-shrink-0">
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-[10px]">Em andamento</p>
                <p className="text-white font-bold text-sm truncate">{locacoesEmAndamento} locações</p>
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-0 justify-end">
              <div className="p-1.5 bg-amber-500/20 rounded-lg flex-shrink-0">
                <Receipt className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white/40 text-[10px]">Pgtos pendentes</p>
                <p className="text-white font-bold text-sm truncate">{locacoesPendentes} locações</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Geral */}
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-6 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Faturamento Total</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(totalGeral)}
          </p>
          <p className="text-xs text-slate-400 mt-2">{dadosLocacoes.length} locações registradas</p>
        </div>

        {/* Recebido */}
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-6 shadow-sm hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Já Recebido</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(totalRecebido)}
          </p>
          <p className="text-xs text-slate-400 mt-2">{dadosLocacoes.filter(l => l.pago).length} pagamentos confirmados</p>
        </div>

        {/* Pendente */}
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-6 shadow-sm hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-xl hover:shadow-amber-500/10 transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">A Receber</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatCurrency(totalPendente)}
          </p>
          <p className="text-xs text-slate-400 mt-2">{locacoesPendentes} pagamentos pendentes</p>
        </div>
      </div>

      {/* Lista de Locações */}
      <div className="bg-[#0f0f11] rounded-2xl border border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800">
          {/* Título e Subtítulo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-neutral-800 rounded-xl">
              <Receipt className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Controle de Pagamentos</h3>
              <p className="text-xs text-slate-500">Marque como pago quando receber</p>
            </div>
          </div>

          {/* Filtros - Segmented Control */}
          <div className="flex bg-neutral-800/80 rounded-xl p-1 w-full">
            <button
              onClick={() => setFilterStatus('todos')}
              className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'todos'
                  ? 'bg-neutral-700 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('pagos')}
              className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'pagos'
                  ? 'bg-neutral-700 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Pagos
            </button>
            <button
              onClick={() => setFilterStatus('pendentes')}
              className={`flex-1 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                filterStatus === 'pendentes'
                  ? 'bg-neutral-700 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Pendentes
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="divide-y divide-neutral-800/50">
          {filteredLocacoes.length === 0 ? (
            <div className="p-10 text-center">
              <Filter className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-medium text-sm">Nenhuma locação encontrada</p>
            </div>
          ) : (
            filteredLocacoes.map((loc) => {
              const isExpanded = expandedId === loc.id

              return (
                <div key={loc.id} className="bg-[#1a1a1e] hover:bg-[#222226] transition-colors first:rounded-t-none last:rounded-b-xl">
                  {/* Linha Principal */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : loc.id)}
                  >
                    {/* Container Principal - Mobile First */}
                    <div className="flex gap-3">
                      {/* Coluna Esquerda: Ícone */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        loc.pago
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-amber-500/20 text-amber-500'
                      }`}>
                        <Package className="w-5 h-5" />
                      </div>

                      {/* Coluna Central: Informações */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Linha 1: Nome do Equipamento + Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-white text-sm leading-tight truncate">
                            {loc.equipamentoNome}
                          </p>
                          {/* Badge de Status - Alinhado à direita */}
                          <div className="flex-shrink-0">
                            {getStatusBadge(loc)}
                          </div>
                        </div>

                        {/* Linha 2: Cliente */}
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{loc.clienteNome}</span>
                        </p>

                        {/* Linha 3: Datas */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{formatDateShort(loc.dataInicio)}</span>
                          <span className="text-slate-600">→</span>
                          <span>{formatDateShort(loc.dataFim)}</span>
                        </div>

                        {/* Linha 4: Valor + Dias + Ações */}
                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-800">
                          {/* Valor e Duração */}
                          <div className="flex items-baseline gap-2">
                            <p className={`font-bold text-base ${
                              loc.pago
                                ? 'text-emerald-400'
                                : 'text-white'
                            }`}>
                              {formatCurrency(loc.valorTotal)}
                            </p>
                            <span className="text-[10px] text-slate-500 bg-neutral-800 px-1.5 py-0.5 rounded">
                              {loc.diasLocacao} dias
                            </span>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-2">
                            {/* Botão Marcar Pago */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTogglePago(loc.id, loc.pago)
                              }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                loc.pago
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-neutral-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                              }`}
                              title={loc.pago ? 'Marcar como pendente' : 'Marcar como pago'}
                            >
                              {loc.pago ? <Check className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                            </button>

                            {/* Chevron */}
                            <div className="text-slate-600">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {isExpanded && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="ml-14 p-4 bg-neutral-800/70 rounded-xl border border-neutral-700/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Valor/Dia</p>
                            <p className="text-sm font-semibold text-white mt-0.5">{formatCurrency(loc.valorDiaria)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                              {loc.pago ? 'Data Pgto' : 'Status Pgto'}
                            </p>
                            <p className={`text-sm font-semibold mt-0.5 ${loc.pago ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {loc.pago && loc.dataPagamento ? formatDate(loc.dataPagamento) : 'Aguardando'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Data Início</p>
                            <p className="text-sm font-semibold text-white mt-0.5">{formatDate(loc.dataInicio)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Data Término</p>
                            <p className="text-sm font-semibold text-white mt-0.5">{formatDate(loc.dataFim)}</p>
                          </div>
                        </div>

                        {/* Ação para marcar como pago */}
                        {!loc.pago && (
                          <button
                            onClick={() => handleTogglePago(loc.id, loc.pago)}
                            className="mt-4 w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Confirmar Recebimento
                          </button>
                        )}

                        {loc.pago && (
                          <button
                            onClick={() => handleTogglePago(loc.id, loc.pago)}
                            className="mt-4 w-full py-2.5 bg-neutral-700 text-slate-300 font-medium rounded-xl hover:bg-neutral-600 transition-all flex items-center justify-center gap-2 text-sm"
                          >
                            <X className="w-4 h-4" />
                            Desfazer Confirmação
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
