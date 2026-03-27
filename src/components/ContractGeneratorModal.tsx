import React from 'react'
import { X } from 'lucide-react'
import { ContractGenerator } from './ContractGenerator'

interface ContractGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: any // Will be typed as DadosContratoCompleto once contractDataMapper is created
}

export function ContractGeneratorModal({
  isOpen,
  onClose,
  initialData
}: ContractGeneratorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Gerar Contrato de Locacao">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[90vw] max-h-[90vh] bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-gray-100 dark:border-neutral-800 overflow-hidden flex flex-col">

        {/* Gradient Bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-[2rem]" />

        {/* Glow Decorativo */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-neutral-800 flex-shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Gerar Contrato de Locacao
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-slate-500 hover:bg-gray-200 dark:hover:bg-neutral-700 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <ContractGenerator
            locadorNome={initialData?.locadorNome}
            locadorDoc={initialData?.locadorDoc}
            propostaAtiva={initialData?.propostaAtiva}
          />
        </div>
      </div>
    </div>
  )
}
