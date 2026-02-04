import { HardHat } from 'lucide-react'
import { type VerticalKey, getVerticalConfig, type SpecFieldConfig } from '../config/verticals'

interface DynamicSpecFieldsProps {
  vertical: VerticalKey
  categoria: string
  specs: Record<string, any>
  onChange: (specs: Record<string, any>) => void
}

export default function DynamicSpecFields({ vertical, categoria, specs, onChange }: DynamicSpecFieldsProps) {
  const vc = getVerticalConfig(vertical)
  const theme = vc.theme

  // Filtra campos visíveis para a categoria atual
  const visibleFields = vc.specFields.filter(
    (field) => !field.showCondition || field.showCondition(categoria)
  )

  if (visibleFields.length === 0) return null

  const handleChange = (key: string, value: any) => {
    onChange({ ...specs, [key]: value })
  }

  const renderField = (field: SpecFieldConfig) => {
    const value = specs[field.key]

    if (field.type === 'boolean') {
      return (
        <label key={field.key} className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(field.key, e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 accent-blue-600"
          />
          <HardHat className="w-5 h-5 text-cta" />
          <span className="text-base font-medium text-gray-700">{field.label}</span>
        </label>
      )
    }

    if (field.type === 'select') {
      return (
        <div key={field.key}>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {field.label} {field.required && '*'}
          </label>
          <select
            value={value || ''}
            onChange={(e) => handleChange(field.key, e.target.value || null)}
            className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-cta outline-none"
            required={field.required}
          >
            <option value="">Selecione...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )
    }

    // number ou text
    return (
      <div key={field.key}>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          {field.label} {field.unit && `(${field.unit})`} {field.required && '*'}
        </label>
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value ?? ''}
          onChange={(e) => {
            const v = field.type === 'number'
              ? (e.target.value ? Number(e.target.value) : null)
              : (e.target.value || null)
            handleChange(field.key, v)
          }}
          placeholder={field.placeholder}
          className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-cta outline-none"
          required={field.required}
        />
      </div>
    )
  }

  // Separa booleans (checkboxes) dos inputs normais
  const booleanFields = visibleFields.filter(f => f.type === 'boolean')
  const inputFields = visibleFields.filter(f => f.type !== 'boolean')

  return (
    <div className={`${theme.specBg} border ${theme.specBorder} rounded-xl p-4 space-y-4`}>
      <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
        Dados Especificos ({vc.label})
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {inputFields.map(renderField)}
      </div>
      {booleanFields.length > 0 && (
        <div className="space-y-3 pt-2">
          {booleanFields.map(renderField)}
        </div>
      )}
    </div>
  )
}
