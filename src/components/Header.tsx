import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronDown, User, LogOut, Bell, Sun, Moon, Package, Clock, FileText, Heart } from 'lucide-react'
import { VERTICALS, VERTICAL_CONFIGS, type VerticalKey } from '../config/verticals'
import { ESTADOS_BR } from '../contexts/AppContext'
import { useTheme } from '../contexts/ThemeContext'
import TraktoLogo from './TraktoLogo'

interface HeaderProps {
  selectedArea: VerticalKey | 'todos'
  onAreaChange: (area: VerticalKey | 'todos') => void
  searchTerm: string
  onSearchChange: (term: string) => void
  localUsuario: string
  nomeUsuario: string
  onSignOut: () => void
  mensagensNaoLidas: number
  selectedUf?: string
  onUfChange?: (uf: string) => void
}

export default function Header({
  selectedArea,
  onAreaChange,
  searchTerm,
  onSearchChange,
  localUsuario,
  nomeUsuario,
  onSignOut,
  mensagensNaoLidas,
  selectedUf = '',
  onUfChange,
}: HeaderProps) {
  const [isAreaOpen, setIsAreaOpen] = useState(false)
  const [isOndeOpen, setIsOndeOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)
  const ondeRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setIsAreaOpen(false)
      if (ondeRef.current && !ondeRef.current.contains(e.target as Node)) setIsOndeOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setIsUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const vc = VERTICAL_CONFIGS[selectedArea === 'todos' ? 'construcao' : selectedArea]

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 z-50 h-16 flex items-center justify-between px-4 md:px-6 transition-all">

      {/* Logo */}
      <Link to="/" className="min-w-fit">
        <TraktoLogo size="sm" />
      </Link>

      {/* ====== SEARCH BAR - Lovable/G4 Style (Desktop) ====== */}
      <div className="hidden lg:flex items-center bg-white dark:bg-slate-800 rounded-xl overflow-hidden max-w-2xl w-full mx-4 h-11 border border-gray-200 dark:border-slate-700 shadow-sm">

        {/* Category Selector */}
        <div
          ref={areaRef}
          className="h-full px-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer transition-colors flex items-center gap-1 border-r border-gray-200 dark:border-slate-600 relative"
          onClick={() => setIsAreaOpen(!isAreaOpen)}
        >
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
            {selectedArea === 'todos' ? 'Tudo' : vc.label}
          </span>
          <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />

          {isAreaOpen && (
            <div className="absolute top-12 left-0 w-[180px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-indigo-500/10 border border-gray-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95">
              <div
                onClick={(e) => { e.stopPropagation(); onAreaChange('todos'); setIsAreaOpen(false) }}
                className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm cursor-pointer transition-colors ${
                  selectedArea === 'todos' ? 'bg-gray-50 dark:bg-slate-700 font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                Tudo
              </div>
              {VERTICALS.map(key => (
                <div
                  key={key}
                  onClick={(e) => { e.stopPropagation(); onAreaChange(key); setIsAreaOpen(false) }}
                  className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm cursor-pointer transition-colors ${
                    selectedArea === key ? 'bg-gray-50 dark:bg-slate-700 font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {VERTICAL_CONFIGS[key].label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar equipamentos..."
          className="flex-1 h-full px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none bg-transparent"
        />

        {/* Location Selector */}
        <div
          ref={ondeRef}
          className="h-full px-3 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 cursor-pointer transition-colors flex items-center gap-1 border-l border-gray-200 dark:border-slate-600 relative"
          onClick={() => setIsOndeOpen(!isOndeOpen)}
        >
          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[80px] truncate">
            {selectedUf || 'Brasil'}
          </span>
          <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />

          {isOndeOpen && (
            <div className="absolute top-12 right-0 w-[160px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-indigo-500/10 border border-gray-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 max-h-[320px] overflow-y-auto">
              <div
                onClick={(e) => { e.stopPropagation(); onUfChange?.(''); setIsOndeOpen(false) }}
                className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm cursor-pointer transition-colors ${
                  !selectedUf ? 'bg-gray-50 dark:bg-slate-700 font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                Todo Brasil
              </div>
              {ESTADOS_BR.map(uf => (
                <div
                  key={uf}
                  onClick={(e) => { e.stopPropagation(); onUfChange?.(uf); setIsOndeOpen(false) }}
                  className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm cursor-pointer transition-colors ${
                    selectedUf === uf ? 'bg-gray-50 dark:bg-slate-700 font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {uf}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Button */}
        <button className="h-full px-5 bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors">
          <Search size={20} className="text-white" strokeWidth={2.5} />
        </button>
      </div>


      {/* ====== USER MENU ====== */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mensagens/Pedidos - Versão Desktop */}
        <Link
          to="/chats"
          className="hidden sm:flex flex-col items-start text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded-lg relative"
        >
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Mensagens</span>
          <span className="text-xs font-bold">e Pedidos</span>
          {mensagensNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {mensagensNaoLidas}
            </span>
          )}
        </Link>

        {/* Mensagens - Versão Mobile (apenas ícone sino) */}
        <Link
          to="/chats"
          className="sm:hidden p-2 text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
        >
          <Bell size={20} />
          {mensagensNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {mensagensNaoLidas}
            </span>
          )}
        </Link>

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User Menu (Mobile + Desktop) */}
        <div
          ref={userRef}
          className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded-lg relative"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          <User size={20} />
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Olá, {nomeUsuario.split(' ')[0]}</span>
            <span className="text-xs font-bold flex items-center gap-1">Conta <ChevronDown size={12} /></span>
          </div>

          {isUserMenuOpen && (
            <div className="absolute top-12 right-0 w-[280px] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 py-3 z-50 animate-in fade-in zoom-in-95">

              {/* Minhas Locações - Destaque */}
              <Link
                to="/equipments"
                className="flex items-center gap-3 mx-3 mb-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <Package size={20} />
                <span className="font-bold">Minhas Locações</span>
              </Link>

              {/* Acompanhar Pedidos */}
              <Link
                to="/orders"
                className="flex items-center gap-3 px-6 py-3 text-slate-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors relative"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <Clock size={20} />
                <div className="flex flex-col">
                  <span className="font-medium">Acompanhar</span>
                  <span className="font-medium">Pedidos</span>
                </div>
                {mensagensNaoLidas > 0 && (
                  <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {mensagensNaoLidas}
                  </span>
                )}
              </Link>

              {/* Documentos */}
              <button
                className="w-full flex items-center gap-3 px-6 py-3 text-slate-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <FileText size={20} />
                <span className="font-medium">Documentos</span>
              </button>

              {/* Favoritos */}
              <button
                className="w-full flex items-center gap-3 px-6 py-3 text-slate-700 dark:text-white/90 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <Heart size={20} />
                <span className="font-medium">Favoritos</span>
              </button>

              {/* Sair */}
              <div className="border-t border-gray-200 dark:border-white/10 mt-3 pt-3 px-3">
                <button
                  onClick={() => { onSignOut(); setIsUserMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span className="font-bold">Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
