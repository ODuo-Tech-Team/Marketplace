import type { LucideIcon } from 'lucide-react'
import {
  Construction, Stethoscope, Cpu, PartyPopper, Wheat,
  Factory, Truck, Zap, Sparkles, UtensilsCrossed,
  HardHat, Building2, Package, Tractor, Sprout,
  Microscope, Syringe, HeartPulse,
  Monitor, Server, Wifi,
  Music, Camera, Tent,
  Cog, Wrench, Sun, Heart, Flame, Thermometer, Box
} from 'lucide-react'

// ===== VERTICAL KEYS =====
export const VERTICALS = [
  'construcao', 'tech', 'medico', 'eventos', 'agro',
  'industrial', 'logistica', 'energia', 'estetica', 'gastronomia'
] as const
export type VerticalKey = typeof VERTICALS[number]

// ===== SPEC FIELD CONFIG =====
export type SpecFieldType = 'number' | 'text' | 'select' | 'boolean'

export interface SpecFieldConfig {
  key: string
  label: string
  type: SpecFieldType
  placeholder?: string
  options?: string[]
  unit?: string
  required?: boolean
  showCondition?: (categoria: string) => boolean
}

// ===== VERTICAL THEME =====
export interface VerticalTheme {
  primary: string
  bg500: string
  bg600: string
  bgHover: string
  bgLight: string
  text600: string
  border500: string
  border200: string
  heroBg: string
  heroGlow: string
  badgeBg: string
  badgeText: string
  pillActive: string
  gradientFrom: string
  gradientTo: string
  gradientBold: string
  shadow500: string
  ring500: string
  specBg: string
  specBorder: string
  cardHoverText: string
  // Colorful vertical selector cards
  verticalCardActive: string
  verticalCardInactive: string
}

// ===== VERTICAL CONFIG =====
export interface VerticalConfig {
  key: VerticalKey
  label: string
  labelPlural: string
  icon: LucideIcon
  theme: VerticalTheme
  hero: {
    title: string
    titleHighlight: string
    subtitle: string
    searchPlaceholder: string
  }
  categories: readonly string[]
  categoryCores: Record<string, string>
  filterPills: Array<{ nome: string; icone: LucideIcon }>
  specFields: SpecFieldConfig[]
  heavyCategories?: readonly string[]
}

// ===== HELPER: Linha Amarela =====
const LINHA_AMARELA_LEGACY = [
  'Escavadeira Hidráulica',
  'Retroescavadeira',
  'Pá Carregadeira',
  'Motoniveladora',
  'Rolo Compactador',
  'Trator de Esteira',
  'Mini Escavadeira'
] as const

export const isLinhaAmarelaCategory = (categoria: string): boolean => {
  return categoria === 'Máquinas Pesadas' || (LINHA_AMARELA_LEGACY as readonly string[]).includes(categoria)
}

// ===== VERTICAL CONFIGS =====
export const VERTICAL_CONFIGS: Record<VerticalKey, VerticalConfig> = {
  // ───────────────────────────────────────────
  // CONSTRUCAO (Amber)
  // ───────────────────────────────────────────
  construcao: {
    key: 'construcao',
    label: 'Construção Civil',
    labelPlural: 'Construção Civil',
    icon: Construction,
    theme: {
      primary: 'amber',
      bg500: 'bg-amber-500',
      bg600: 'bg-amber-600',
      bgHover: 'hover:bg-amber-600',
      bgLight: 'bg-amber-50',
      text600: 'text-amber-600',
      border500: 'border-amber-500',
      border200: 'border-amber-200',
      heroBg: 'bg-slate-900',
      heroGlow: 'bg-amber-500/20',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      pillActive: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20',
      gradientFrom: 'from-amber-400',
      gradientTo: 'to-amber-200',
      gradientBold: 'from-amber-500 to-orange-600',
      shadow500: 'shadow-amber-500/30',
      ring500: 'ring-amber-500',
      specBg: 'bg-amber-50',
      specBorder: 'border-amber-200',
      cardHoverText: 'group-hover:text-amber-600',
      verticalCardActive: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/30 border-transparent',
      verticalCardInactive: 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15 hover:border-amber-500/30',
    },
    hero: {
      title: 'Equipamentos para sua obra',
      titleHighlight: 'na palma da mão.',
      subtitle: 'Máquinas pesadas e ferramentas para construção civil.',
      searchPlaceholder: 'O que você precisa? (Ex: Retroescavadeira...)',
    },
    categories: [
      'Máquinas Pesadas',
      'Equipamentos',
      'Ferramentas',
    ],
    categoryCores: {
      'Máquinas Pesadas': 'bg-amber-600',
      'Equipamentos': 'bg-blue-600',
      'Ferramentas': 'bg-slate-600',
      // Legacy
      'Escavadeira Hidráulica': 'bg-yellow-600', 'Retroescavadeira': 'bg-amber-700',
      'Pá Carregadeira': 'bg-yellow-500', 'Motoniveladora': 'bg-orange-600',
      'Rolo Compactador': 'bg-zinc-700', 'Trator de Esteira': 'bg-slate-600',
      'Mini Escavadeira': 'bg-yellow-700', 'Betoneiras': 'bg-amber-700',
      'Andaimes': 'bg-slate-600', 'Ferramentas Elétricas': 'bg-yellow-600',
      'Geradores': 'bg-zinc-700', 'Compactadores': 'bg-stone-600', 'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Linha Amarela', icone: Construction },
      { nome: 'Ferramentas', icone: HardHat },
      { nome: 'Construção', icone: Building2 },
      { nome: 'Outros', icone: Package },
    ],
    heavyCategories: ['Máquinas Pesadas', ...LINHA_AMARELA_LEGACY],
    specFields: [
      { key: 'ano', label: 'Ano', type: 'number', placeholder: '2020', showCondition: isLinhaAmarelaCategory },
      { key: 'horimetro_atual', label: 'Horímetro (h)', type: 'number', placeholder: '5000', unit: 'h', showCondition: isLinhaAmarelaCategory },
      { key: 'peso_operacional', label: 'Peso (ton)', type: 'number', placeholder: '4.5', unit: 'ton', showCondition: isLinhaAmarelaCategory },
      { key: 'oferece_operador', label: 'Oferecer operador com esta máquina?', type: 'boolean', showCondition: isLinhaAmarelaCategory },
      { key: 'voltagem', label: 'Voltagem', type: 'select', options: ['110v', '220v', 'Bivolt', 'Bateria'], required: true, showCondition: (cat) => !isLinhaAmarelaCategory(cat) },
    ],
  },

  // ───────────────────────────────────────────
  // TECH (Blue)
  // ───────────────────────────────────────────
  tech: {
    key: 'tech',
    label: 'Tech & TI',
    labelPlural: 'Tecnologia & TI',
    icon: Cpu,
    theme: {
      primary: 'blue',
      bg500: 'bg-blue-500',
      bg600: 'bg-blue-600',
      bgHover: 'hover:bg-blue-600',
      bgLight: 'bg-blue-50',
      text600: 'text-blue-600',
      border500: 'border-blue-500',
      border200: 'border-blue-200',
      heroBg: 'bg-blue-950',
      heroGlow: 'bg-blue-500/20',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
      pillActive: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20',
      gradientFrom: 'from-blue-400',
      gradientTo: 'to-blue-200',
      gradientBold: 'from-blue-600 to-indigo-600',
      shadow500: 'shadow-blue-500/30',
      ring500: 'ring-blue-500',
      specBg: 'bg-blue-50',
      specBorder: 'border-blue-200',
      cardHoverText: 'group-hover:text-blue-600',
      verticalCardActive: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/30 border-transparent',
      verticalCardInactive: 'bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/15 hover:border-blue-500/30',
    },
    hero: {
      title: 'Hardware sob demanda',
      titleHighlight: 'para sua empresa.',
      subtitle: 'Notebooks, servidores e audiovisual.',
      searchPlaceholder: 'Buscar equipamento tech...',
    },
    categories: [
      'Computadores',
      'Rede & Infra',
      'Audiovisual',
    ],
    categoryCores: {
      'Computadores': 'bg-blue-600',
      'Rede & Infra': 'bg-indigo-700',
      'Audiovisual': 'bg-violet-600',
      // Legacy
      'Notebooks': 'bg-blue-600', 'Desktops': 'bg-blue-700', 'Servidores': 'bg-indigo-700',
      'Switches/Roteadores': 'bg-sky-600', 'Projetores': 'bg-violet-600',
      'Telas/Monitores': 'bg-blue-500', 'Impressoras': 'bg-slate-600',
      'Tablets': 'bg-cyan-600', 'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Computadores', icone: Monitor },
      { nome: 'Infraestrutura', icone: Server },
      { nome: 'Rede', icone: Wifi },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'Dell' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Latitude 5540' },
      { key: 'processador', label: 'Processador', type: 'text', placeholder: 'i7-1365U' },
      { key: 'ram', label: 'RAM (GB)', type: 'number', placeholder: '16', unit: 'GB' },
      { key: 'armazenamento', label: 'Armazenamento', type: 'text', placeholder: '512GB SSD' },
      { key: 'sistema_operacional', label: 'Sistema Op.', type: 'select', options: ['Windows', 'macOS', 'Linux', 'ChromeOS', 'N/A'] },
      { key: 'voltagem', label: 'Voltagem', type: 'select', options: ['110v', '220v', 'Bivolt', 'Bateria'] },
    ],
  },

  // ───────────────────────────────────────────
  // MEDICO (Emerald)
  // ───────────────────────────────────────────
  medico: {
    key: 'medico',
    label: 'Saúde & Médica',
    labelPlural: 'Equipamentos Médicos',
    icon: Stethoscope,
    theme: {
      primary: 'emerald',
      bg500: 'bg-emerald-500',
      bg600: 'bg-emerald-600',
      bgHover: 'hover:bg-emerald-600',
      bgLight: 'bg-emerald-50',
      text600: 'text-emerald-600',
      border500: 'border-emerald-500',
      border200: 'border-emerald-200',
      heroBg: 'bg-emerald-950',
      heroGlow: 'bg-emerald-500/20',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      pillActive: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20',
      gradientFrom: 'from-emerald-400',
      gradientTo: 'to-emerald-200',
      gradientBold: 'from-emerald-500 to-teal-600',
      shadow500: 'shadow-emerald-500/30',
      ring500: 'ring-emerald-500',
      specBg: 'bg-emerald-50',
      specBorder: 'border-emerald-200',
      cardHoverText: 'group-hover:text-emerald-600',
      verticalCardActive: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 border-transparent',
      verticalCardInactive: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/30',
    },
    hero: {
      title: 'Tecnologia para sua clínica',
      titleHighlight: 'e home care.',
      subtitle: 'Equipamentos certificados e calibrados.',
      searchPlaceholder: 'Buscar equipamento médico...',
    },
    categories: [
      'Diagnóstico & Imagem',
      'Suporte & Terapia',
      'Mobiliário Hospitalar',
    ],
    categoryCores: {
      'Diagnóstico & Imagem': 'bg-emerald-600',
      'Suporte & Terapia': 'bg-teal-600',
      'Mobiliário Hospitalar': 'bg-emerald-500',
      // Legacy
      'Monitores Médicos': 'bg-emerald-600', 'Ventiladores': 'bg-teal-600',
      'Bombas de Infusão': 'bg-emerald-700', 'Ultrassom': 'bg-cyan-600',
      'Raio-X Portátil': 'bg-sky-700', 'Desfibriladores': 'bg-red-600',
      'Camas Hospitalares': 'bg-emerald-500', 'Cadeiras de Rodas': 'bg-teal-500',
      'Macas': 'bg-slate-600', 'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Diagnóstico', icone: Microscope },
      { nome: 'Suporte Vital', icone: HeartPulse },
      { nome: 'Cirúrgico', icone: Syringe },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'registro_anvisa', label: 'Registro ANVISA', type: 'text', placeholder: '80000000000' },
      { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'Philips' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'IntelliVue MX40' },
      { key: 'ano_fabricacao', label: 'Ano Fabricação', type: 'number', placeholder: '2022' },
      { key: 'calibrado', label: 'Equipamento calibrado?', type: 'boolean' },
      { key: 'voltagem', label: 'Voltagem', type: 'select', options: ['110v', '220v', 'Bivolt', 'Bateria'] },
    ],
  },

  // ───────────────────────────────────────────
  // EVENTOS (Rose)
  // ───────────────────────────────────────────
  eventos: {
    key: 'eventos',
    label: 'Eventos & Festas',
    labelPlural: 'Eventos & Festas',
    icon: PartyPopper,
    theme: {
      primary: 'rose',
      bg500: 'bg-rose-500',
      bg600: 'bg-rose-600',
      bgHover: 'hover:bg-rose-600',
      bgLight: 'bg-rose-50',
      text600: 'text-rose-600',
      border500: 'border-rose-500',
      border200: 'border-rose-200',
      heroBg: 'bg-rose-950',
      heroGlow: 'bg-rose-500/20',
      badgeBg: 'bg-rose-100',
      badgeText: 'text-rose-800',
      pillActive: 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20',
      gradientFrom: 'from-rose-400',
      gradientTo: 'to-rose-200',
      gradientBold: 'from-rose-500 to-pink-600',
      shadow500: 'shadow-rose-500/30',
      ring500: 'ring-rose-500',
      specBg: 'bg-rose-50',
      specBorder: 'border-rose-200',
      cardHoverText: 'group-hover:text-rose-600',
      verticalCardActive: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-500/30 border-transparent',
      verticalCardInactive: 'bg-rose-500/10 border-rose-500/20 text-rose-300 hover:bg-rose-500/15 hover:border-rose-500/30',
    },
    hero: {
      title: 'Tudo para seu evento',
      titleHighlight: 'num só lugar.',
      subtitle: 'Som, iluminação, estrutura e mobiliário.',
      searchPlaceholder: 'Buscar para eventos...',
    },
    categories: [
      'Som & Iluminação',
      'Estruturas & Mobiliário',
      'Audiovisual',
    ],
    categoryCores: {
      'Som & Iluminação': 'bg-rose-600',
      'Estruturas & Mobiliário': 'bg-rose-700',
      'Audiovisual': 'bg-pink-600',
      // Legacy
      'Som/Áudio': 'bg-rose-600', 'Iluminação': 'bg-pink-600',
      'Palcos/Estruturas': 'bg-rose-700', 'Tendas': 'bg-fuchsia-600',
      'Mesas e Cadeiras': 'bg-rose-500', 'Geradores': 'bg-zinc-700',
      'Foto/Vídeo': 'bg-pink-700', 'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Áudio/Visual', icone: Music },
      { nome: 'Foto/Vídeo', icone: Camera },
      { nome: 'Estruturas', icone: Tent },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'fabricante', label: 'Fabricante/Marca', type: 'text', placeholder: 'JBL' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'PRX 815' },
      { key: 'potencia', label: 'Potência (W)', type: 'number', placeholder: '1500', unit: 'W' },
      { key: 'capacidade', label: 'Capacidade', type: 'text', placeholder: 'Ex: 200 pessoas' },
      { key: 'voltagem', label: 'Voltagem', type: 'select', options: ['110v', '220v', 'Bivolt', 'Bateria'] },
    ],
  },

  // ───────────────────────────────────────────
  // AGRO (Lime)
  // ───────────────────────────────────────────
  agro: {
    key: 'agro',
    label: 'Agro & Rural',
    labelPlural: 'Agro & Rural',
    icon: Wheat,
    theme: {
      primary: 'lime',
      bg500: 'bg-lime-500',
      bg600: 'bg-lime-600',
      bgHover: 'hover:bg-lime-600',
      bgLight: 'bg-lime-50',
      text600: 'text-lime-700',
      border500: 'border-lime-500',
      border200: 'border-lime-200',
      heroBg: 'bg-lime-950',
      heroGlow: 'bg-lime-500/20',
      badgeBg: 'bg-lime-100',
      badgeText: 'text-lime-800',
      pillActive: 'bg-lime-500 text-white border-lime-500 shadow-lg shadow-lime-500/20',
      gradientFrom: 'from-lime-400',
      gradientTo: 'to-lime-200',
      gradientBold: 'from-lime-500 to-green-600',
      shadow500: 'shadow-lime-500/30',
      ring500: 'ring-lime-500',
      specBg: 'bg-lime-50',
      specBorder: 'border-lime-200',
      cardHoverText: 'group-hover:text-lime-600',
      verticalCardActive: 'bg-gradient-to-r from-lime-500 to-green-600 text-white shadow-xl shadow-lime-500/30 border-transparent',
      verticalCardInactive: 'bg-lime-500/10 border-lime-500/20 text-lime-300 hover:bg-lime-500/15 hover:border-lime-500/30',
    },
    hero: {
      title: 'Soluções para o campo',
      titleHighlight: 'e colheita.',
      subtitle: 'Tratores, implementos e irrigação.',
      searchPlaceholder: 'Buscar equipamento agrícola...',
    },
    categories: [
      'Máquinas Agrícolas',
      'Implementos',
      'Irrigação & Tech',
    ],
    categoryCores: {
      'Máquinas Agrícolas': 'bg-lime-600',
      'Implementos': 'bg-lime-500',
      'Irrigação & Tech': 'bg-cyan-600',
      // Legacy
      'Tratores': 'bg-lime-600', 'Colheitadeiras': 'bg-green-700',
      'Plantadeiras': 'bg-lime-700', 'Pulverizadores': 'bg-emerald-600',
      'Irrigação': 'bg-cyan-600', 'Roçadeiras': 'bg-green-600', 'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Mecanização', icone: Tractor },
      { nome: 'Cultivo', icone: Sprout },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'John Deere' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: '6110J' },
      { key: 'ano', label: 'Ano', type: 'number', placeholder: '2022' },
      { key: 'potencia_cv', label: 'Potência (CV)', type: 'number', placeholder: '110', unit: 'CV' },
      { key: 'horas_uso', label: 'Horas de Uso', type: 'number', placeholder: '3000', unit: 'h' },
      { key: 'tracao', label: 'Tração', type: 'select', options: ['4x2', '4x4', 'Esteira'] },
    ],
  },

  // ───────────────────────────────────────────
  // INDUSTRIAL (Cyan)
  // ───────────────────────────────────────────
  industrial: {
    key: 'industrial',
    label: 'Industrial',
    labelPlural: 'Indústria & Fábricas',
    icon: Factory,
    theme: {
      primary: 'cyan',
      bg500: 'bg-cyan-500',
      bg600: 'bg-cyan-600',
      bgHover: 'hover:bg-cyan-600',
      bgLight: 'bg-cyan-50',
      text600: 'text-cyan-600',
      border500: 'border-cyan-500',
      border200: 'border-cyan-200',
      heroBg: 'bg-cyan-950',
      heroGlow: 'bg-cyan-500/20',
      badgeBg: 'bg-cyan-100',
      badgeText: 'text-cyan-800',
      pillActive: 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20',
      gradientFrom: 'from-cyan-400',
      gradientTo: 'to-cyan-200',
      gradientBold: 'from-cyan-500 to-sky-600',
      shadow500: 'shadow-cyan-500/30',
      ring500: 'ring-cyan-500',
      specBg: 'bg-cyan-50',
      specBorder: 'border-cyan-200',
      cardHoverText: 'group-hover:text-cyan-600',
      verticalCardActive: 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-xl shadow-cyan-500/30 border-transparent',
      verticalCardInactive: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/15 hover:border-cyan-500/30',
    },
    hero: {
      title: 'Máquinas para sua fábrica',
      titleHighlight: 'sob demanda.',
      subtitle: 'CNC, compressores, empilhadeiras e mais.',
      searchPlaceholder: 'Buscar equipamento industrial...',
    },
    categories: [
      'Máquinas & CNC',
      'Soldagem & Corte',
      'Compressores & Bombas',
    ],
    categoryCores: {
      'Máquinas & CNC': 'bg-cyan-600',
      'Soldagem & Corte': 'bg-sky-700',
      'Compressores & Bombas': 'bg-cyan-700',
      'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Usinagem', icone: Cog },
      { nome: 'Soldagem', icone: Flame },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'Romi' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'D600' },
      { key: 'ano', label: 'Ano', type: 'number', placeholder: '2020' },
      { key: 'potencia', label: 'Potência (CV)', type: 'number', placeholder: '15', unit: 'CV' },
      { key: 'voltagem', label: 'Voltagem', type: 'select', options: ['220v', '380v', 'Trifásico', 'Bivolt'] },
    ],
  },

  // ───────────────────────────────────────────
  // LOGISTICA (Violet)
  // ───────────────────────────────────────────
  logistica: {
    key: 'logistica',
    label: 'Logística',
    labelPlural: 'Logística & Transporte',
    icon: Truck,
    theme: {
      primary: 'violet',
      bg500: 'bg-violet-500',
      bg600: 'bg-violet-600',
      bgHover: 'hover:bg-violet-600',
      bgLight: 'bg-violet-50',
      text600: 'text-violet-600',
      border500: 'border-violet-500',
      border200: 'border-violet-200',
      heroBg: 'bg-violet-950',
      heroGlow: 'bg-violet-500/20',
      badgeBg: 'bg-violet-100',
      badgeText: 'text-violet-800',
      pillActive: 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/20',
      gradientFrom: 'from-violet-400',
      gradientTo: 'to-violet-200',
      gradientBold: 'from-violet-500 to-purple-600',
      shadow500: 'shadow-violet-500/30',
      ring500: 'ring-violet-500',
      specBg: 'bg-violet-50',
      specBorder: 'border-violet-200',
      cardHoverText: 'group-hover:text-violet-600',
      verticalCardActive: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/30 border-transparent',
      verticalCardInactive: 'bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/15 hover:border-violet-500/30',
    },
    hero: {
      title: 'Frota e armazenagem',
      titleHighlight: 'para sua operação.',
      subtitle: 'Caminhões, empilhadeiras e containers.',
      searchPlaceholder: 'Buscar veículo ou equipamento...',
    },
    categories: [
      'Veículos & Caminhões',
      'Empilhadeiras & Guindastes',
      'Containers & Armazenagem',
    ],
    categoryCores: {
      'Veículos & Caminhões': 'bg-violet-600',
      'Empilhadeiras & Guindastes': 'bg-purple-600',
      'Containers & Armazenagem': 'bg-violet-700',
      'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Veículos', icone: Truck },
      { nome: 'Armazenagem', icone: Box },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'marca', label: 'Marca', type: 'text', placeholder: 'Mercedes-Benz' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Atego 2430' },
      { key: 'ano', label: 'Ano', type: 'number', placeholder: '2022' },
      { key: 'capacidade_carga', label: 'Capacidade (ton)', type: 'number', placeholder: '14', unit: 'ton' },
      { key: 'combustivel', label: 'Combustível', type: 'select', options: ['Diesel', 'Gasolina', 'Elétrico', 'GNV', 'Flex'] },
    ],
  },

  // ───────────────────────────────────────────
  // ENERGIA (Yellow)
  // ───────────────────────────────────────────
  energia: {
    key: 'energia',
    label: 'Energia',
    labelPlural: 'Energia & Solar',
    icon: Zap,
    theme: {
      primary: 'yellow',
      bg500: 'bg-yellow-500',
      bg600: 'bg-yellow-600',
      bgHover: 'hover:bg-yellow-600',
      bgLight: 'bg-yellow-50',
      text600: 'text-yellow-600',
      border500: 'border-yellow-500',
      border200: 'border-yellow-200',
      heroBg: 'bg-yellow-950',
      heroGlow: 'bg-yellow-500/20',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      pillActive: 'bg-yellow-500 text-white border-yellow-500 shadow-lg shadow-yellow-500/20',
      gradientFrom: 'from-yellow-400',
      gradientTo: 'to-yellow-200',
      gradientBold: 'from-yellow-500 to-orange-500',
      shadow500: 'shadow-yellow-500/30',
      ring500: 'ring-yellow-500',
      specBg: 'bg-yellow-50',
      specBorder: 'border-yellow-200',
      cardHoverText: 'group-hover:text-yellow-600',
      verticalCardActive: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-xl shadow-yellow-500/30 border-transparent',
      verticalCardInactive: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/15 hover:border-yellow-500/30',
    },
    hero: {
      title: 'Energia sob demanda',
      titleHighlight: 'para qualquer projeto.',
      subtitle: 'Geradores, painéis solares e transformadores.',
      searchPlaceholder: 'Buscar gerador ou painel...',
    },
    categories: [
      'Geradores',
      'Solar & Fotovoltaico',
      'Distribuição & Transformadores',
    ],
    categoryCores: {
      'Geradores': 'bg-yellow-600',
      'Solar & Fotovoltaico': 'bg-orange-500',
      'Distribuição & Transformadores': 'bg-yellow-700',
      'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Geradores', icone: Zap },
      { nome: 'Solar', icone: Sun },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'Cummins' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'C150D5' },
      { key: 'potencia_kva', label: 'Potência (kVA)', type: 'number', placeholder: '150', unit: 'kVA' },
      { key: 'combustivel', label: 'Combustível', type: 'select', options: ['Diesel', 'Gasolina', 'Gás', 'Solar', 'N/A'] },
      { key: 'voltagem', label: 'Voltagem', type: 'select', options: ['110v', '220v', '380v', 'Bivolt', 'Trifásico'] },
    ],
  },

  // ───────────────────────────────────────────
  // ESTETICA (Fuchsia)
  // ───────────────────────────────────────────
  estetica: {
    key: 'estetica',
    label: 'Estética',
    labelPlural: 'Estética & Beleza',
    icon: Sparkles,
    theme: {
      primary: 'fuchsia',
      bg500: 'bg-fuchsia-500',
      bg600: 'bg-fuchsia-600',
      bgHover: 'hover:bg-fuchsia-600',
      bgLight: 'bg-fuchsia-50',
      text600: 'text-fuchsia-600',
      border500: 'border-fuchsia-500',
      border200: 'border-fuchsia-200',
      heroBg: 'bg-fuchsia-950',
      heroGlow: 'bg-fuchsia-500/20',
      badgeBg: 'bg-fuchsia-100',
      badgeText: 'text-fuchsia-800',
      pillActive: 'bg-fuchsia-500 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-500/20',
      gradientFrom: 'from-fuchsia-400',
      gradientTo: 'to-fuchsia-200',
      gradientBold: 'from-fuchsia-500 to-pink-500',
      shadow500: 'shadow-fuchsia-500/30',
      ring500: 'ring-fuchsia-500',
      specBg: 'bg-fuchsia-50',
      specBorder: 'border-fuchsia-200',
      cardHoverText: 'group-hover:text-fuchsia-600',
      verticalCardActive: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-xl shadow-fuchsia-500/30 border-transparent',
      verticalCardInactive: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/15 hover:border-fuchsia-500/30',
    },
    hero: {
      title: 'Equipamentos estéticos',
      titleHighlight: 'de última geração.',
      subtitle: 'Laser, criolipólise, radiofrequência e mais.',
      searchPlaceholder: 'Buscar equipamento estético...',
    },
    categories: [
      'Laser & Luz Pulsada',
      'Corporal',
      'Facial & Capilar',
    ],
    categoryCores: {
      'Laser & Luz Pulsada': 'bg-fuchsia-600',
      'Corporal': 'bg-pink-600',
      'Facial & Capilar': 'bg-fuchsia-500',
      'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Laser', icone: Sparkles },
      { nome: 'Corporal', icone: Heart },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'Alma Lasers' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Soprano Titanium' },
      { key: 'tecnologia', label: 'Tecnologia', type: 'select', options: ['Laser Diodo', 'IPL', 'Radiofrequência', 'Criolipólise', 'Ultrassom Focalizado', 'LED', 'Outro'] },
      { key: 'registro_anvisa', label: 'Registro ANVISA', type: 'text', placeholder: '80000000000' },
      { key: 'voltagem', label: 'Voltagem', type: 'select', options: ['110v', '220v', 'Bivolt'] },
    ],
  },

  // ───────────────────────────────────────────
  // GASTRONOMIA (Orange)
  // ───────────────────────────────────────────
  gastronomia: {
    key: 'gastronomia',
    label: 'Gastronomia',
    labelPlural: 'Gastronomia & Food Service',
    icon: UtensilsCrossed,
    theme: {
      primary: 'orange',
      bg500: 'bg-orange-500',
      bg600: 'bg-orange-600',
      bgHover: 'hover:bg-orange-600',
      bgLight: 'bg-orange-50',
      text600: 'text-orange-600',
      border500: 'border-orange-500',
      border200: 'border-orange-200',
      heroBg: 'bg-orange-950',
      heroGlow: 'bg-orange-500/20',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-800',
      pillActive: 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20',
      gradientFrom: 'from-orange-400',
      gradientTo: 'to-orange-200',
      gradientBold: 'from-orange-500 to-red-500',
      shadow500: 'shadow-orange-500/30',
      ring500: 'ring-orange-500',
      specBg: 'bg-orange-50',
      specBorder: 'border-orange-200',
      cardHoverText: 'group-hover:text-orange-600',
      verticalCardActive: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl shadow-orange-500/30 border-transparent',
      verticalCardInactive: 'bg-orange-500/10 border-orange-500/20 text-orange-300 hover:bg-orange-500/15 hover:border-orange-500/30',
    },
    hero: {
      title: 'Equipamentos gastronômicos',
      titleHighlight: 'prontos para uso.',
      subtitle: 'Fornos, freezers, food trucks e mais.',
      searchPlaceholder: 'Buscar equipamento gastronômico...',
    },
    categories: [
      'Cocção & Preparo',
      'Refrigeração',
      'Móveis & Expositores',
    ],
    categoryCores: {
      'Cocção & Preparo': 'bg-orange-600',
      'Refrigeração': 'bg-red-600',
      'Móveis & Expositores': 'bg-orange-700',
      'Outros': 'bg-gray-600',
    },
    filterPills: [
      { nome: 'Todos', icone: Package },
      { nome: 'Cocção', icone: Flame },
      { nome: 'Refrigeração', icone: Thermometer },
      { nome: 'Outros', icone: Package },
    ],
    specFields: [
      { key: 'fabricante', label: 'Fabricante', type: 'text', placeholder: 'Prática' },
      { key: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Miniconv' },
      { key: 'capacidade', label: 'Capacidade', type: 'text', placeholder: 'Ex: 10 bandejas GN' },
      { key: 'tipo_gas', label: 'Tipo Gás/Energia', type: 'select', options: ['GLP', 'Gás Natural', 'Elétrico', 'Bivolt'] },
      { key: 'voltagem', label: 'Voltagem', type: 'select', options: ['110v', '220v', 'Bivolt', '380v'] },
    ],
  },
}

// ===== HELPER FUNCTIONS =====

export const getVerticalConfig = (key: VerticalKey): VerticalConfig => VERTICAL_CONFIGS[key]

export const getVerticalForCategory = (categoria: string): VerticalKey => {
  for (const [key, config] of Object.entries(VERTICAL_CONFIGS)) {
    if ((config.categories as readonly string[]).includes(categoria)) return key as VerticalKey
  }
  return 'construcao'
}

export const getAllCategories = (vertical: VerticalKey): readonly string[] => {
  return VERTICAL_CONFIGS[vertical].categories
}

export const getCategoryCor = (vertical: VerticalKey, categoria: string): string => {
  return VERTICAL_CONFIGS[vertical].categoryCores[categoria] || 'bg-gray-600'
}

export const DEFAULT_VERTICAL: VerticalKey = 'construcao'
