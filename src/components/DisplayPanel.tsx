import { CalculationMode } from '../types'
import { useState } from 'react'

interface DisplayPanelProps {
    expression: string
    result: string
    mode: CalculationMode
    hasMemory: boolean
    onPaste?: (text: string) => void
    onChange?: (value: string) => void
}

export default function DisplayPanel({ expression, result, mode, hasMemory, onPaste, onChange }: DisplayPanelProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText()
            if (onPaste) {
                onPaste(text)
            }
        } catch (err) {
            console.error('Failed to paste:', err)
        }
    }

    return (
        <div className="px-6 py-8 bg-[var(--display-bg)] border-b border-[var(--border-color)]">
            <div className="max-w-4xl mx-auto">
                {/* Mode and Memory Indicators */}
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-[var(--text-secondary)] font-medium uppercase">
                        {mode} Mode
                    </div>
                    <div className="flex items-center gap-2">
                        {hasMemory && (
                            <div className="text-sm text-[var(--accent)] font-medium">
                                M
                            </div>
                        )}
                        {/* Copy/Paste Buttons */}
                        <button
                            onClick={handlePaste}
                            className="px-3 py-1 text-xs rounded bg-[var(--button-bg)] hover:bg-[var(--button-hover)] text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
                            title="Paste (Ctrl+V)"
                        >
                            📋 Paste
                        </button>
                        <button
                            onClick={handleCopy}
                            className="px-3 py-1 text-xs rounded bg-[var(--button-bg)] hover:bg-[var(--button-hover)] text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
                            title="Copy Result (Ctrl+C)"
                        >
                            {copied ? '✓ Copied!' : '📄 Copy'}
                        </button>
                    </div>
                </div>

                {/* Expression Display */}
                <div className="min-h-[3rem] mb-2">
                    <input
                        type="text"
                        value={expression}
                        onChange={(e) => onChange && onChange(e.target.value)}
                        className="w-full text-2xl text-[var(--text-secondary)] font-mono bg-transparent border-none focus:outline-none text-right"
                        placeholder="0"
                    />
                </div>

                {/* Result Display */}
                <div className="min-h-[4rem]">
                    <div className="text-5xl font-bold text-[var(--text-primary)] font-mono break-all text-right">
                        {result}
                    </div>
                </div>
            </div>
        </div>
    )
}
