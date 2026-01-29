import { Variable } from '../types'

interface VariablesPanelProps {
    variables: Variable[]
    onDeleteVariable: (id: number) => void
    onClearAll: () => void
}

export default function VariablesPanel({ variables, onDeleteVariable, onClearAll }: VariablesPanelProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Variables</h3>
                {variables.length > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs px-2 py-1 rounded text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Clear all variables"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Variables List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {variables.length === 0 ? (
                    <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                        No variables defined
                        <p className="text-xs mt-2 opacity-70">Use: name = value</p>
                    </div>
                ) : (
                    variables.map((variable) => (
                        <div
                            key={variable.id}
                            className="flex items-center justify-between p-3 rounded bg-[var(--button-bg)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors group"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-mono text-[var(--accent)] font-semibold truncate">
                                    {variable.name}
                                </div>
                                <div className="text-xs font-mono text-[var(--text-secondary)] truncate">
                                    = {variable.value}
                                </div>
                            </div>
                            <button
                                onClick={() => variable.id && onDeleteVariable(variable.id)}
                                className="ml-2 p-1 rounded text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete variable"
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
