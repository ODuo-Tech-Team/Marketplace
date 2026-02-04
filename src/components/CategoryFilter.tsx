interface CategoryFilterProps {
  filters: string[]
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export default function CategoryFilter({ filters, activeFilter, onFilterChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
      {filters.map(filter => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border ${
            activeFilter === filter
              ? 'bg-surface-elevated text-foreground border-border shadow-lg shadow-cta/20 scale-105'
              : 'bg-surface-card text-foreground-secondary border-border-subtle hover:border-border hover:text-foreground hover:shadow-md'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}
