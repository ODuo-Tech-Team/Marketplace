import { useTheme } from '../contexts/ThemeContext'

interface TraktoLogoProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { icon: 'w-8 h-8', title: 'text-lg', sub: 'text-[7px] tracking-[0.2em]', gap: 'gap-2' },
  md: { icon: 'w-10 h-10', title: 'text-2xl', sub: 'text-[8px] tracking-[0.25em]', gap: 'gap-2.5' },
  lg: { icon: 'w-14 h-14', title: 'text-4xl', sub: 'text-[10px] tracking-[0.3em]', gap: 'gap-3' },
}

export default function TraktoLogo({ size = 'md' }: TraktoLogoProps) {
  const s = sizeConfig[size]
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`flex items-center ${s.gap} cursor-pointer group`}>
      {/* Icone */}
      <div className={`relative ${s.icon} flex-shrink-0 transition-transform group-hover:scale-105 duration-200`}>
        <div className="absolute inset-0 bg-cta rounded-md"></div>
        <svg viewBox="0 0 100 100" className="relative z-10 w-full h-full p-1">
          {/* Simplified tractor icon */}
          <path d="M25 75 H65 V50 H35 L25 75 Z" fill="white" />
          <path d="M35 50 V35 H65 V50" fill="white" />
          <circle cx="35" cy="75" r="10" fill="white" stroke="#0f172a" strokeWidth="3"/>
          <circle cx="60" cy="75" r="8" fill="white" stroke="#0f172a" strokeWidth="3"/>
          <path d="M70 35 L85 50 L75 65" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Texto */}
      <div className="flex flex-col justify-center leading-none">
        <h1
          className={`${s.title} font-bold tracking-tight transition-colors ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
          style={{ fontFamily: '"Chakra Petch", sans-serif' }}
        >
          TRAKTO
        </h1>
        <span className={`text-cta font-bold ${s.sub} uppercase`}>
          RENT
        </span>
      </div>
    </div>
  )
}
