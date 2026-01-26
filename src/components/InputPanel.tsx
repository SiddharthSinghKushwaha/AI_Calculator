import { useState, useEffect } from 'react'
import { CalculationMode } from '../types'

interface InputPanelProps {
    mode: CalculationMode
    scatteredKeypad: boolean
    onInput: (value: string) => void
    onClear: () => void
    onBackspace: () => void
    onCalculate: () => void
    onMemoryAdd: () => void
    onMemorySubtract: () => void
    onMemoryRecall: () => void
    onMemoryClear: () => void
    onMemoryStore: () => void
}

export default function InputPanel({
    mode,
    scatteredKeypad,
    onInput,
    onClear,
    onBackspace,
    onCalculate,
    onMemoryAdd,
    onMemorySubtract,
    onMemoryRecall,
    onMemoryClear,
    onMemoryStore,
}: InputPanelProps) {
    const [numberLayout, setNumberLayout] = useState<string[]>(['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'])
    const [isAnimating, setIsAnimating] = useState(false)
    const [pressedButton, setPressedButton] = useState<string | null>(null)

    useEffect(() => {
        if (scatteredKeypad) {
            shuffleNumbers()
        } else {
            setNumberLayout(['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'])
        }
    }, [scatteredKeypad])

    const shuffleNumbers = () => {
        setIsAnimating(true)
        const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        const shuffled = [...numbers].sort(() => Math.random() - 0.5)

        setTimeout(() => {
            setNumberLayout(shuffled)
            setTimeout(() => setIsAnimating(false), 300)
        }, 150)
    }

    const handleButtonClick = (value: string, callback: () => void) => {
        setPressedButton(value)
        callback()
        setTimeout(() => setPressedButton(null), 200)
    }

    const baseButtons = [
        { label: 'C', onClick: onClear, className: 'bg-red-500 hover:bg-red-600 text-white' },
        { label: '←', onClick: onBackspace, className: 'bg-[var(--bg-tertiary)]' },
        { label: '÷', onClick: () => onInput('/'), className: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white' },
        { label: '×', onClick: () => onInput('*'), className: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white' },
        { label: '-', onClick: () => onInput('-'), className: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white' },
        { label: '+', onClick: () => onInput('+'), className: 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white' },
        { label: '.', onClick: () => onInput('.'), className: 'bg-[var(--button-bg)]' },
        { label: '=', onClick: onCalculate, className: 'bg-green-500 hover:bg-green-600 text-white col-span-2' },
    ]

    const scientificButtons = [
        { label: 'sin', onClick: () => onInput('sin(') },
        { label: 'cos', onClick: () => onInput('cos(') },
        { label: 'tan', onClick: () => onInput('tan(') },
        { label: 'log', onClick: () => onInput('log(') },
        { label: 'ln', onClick: () => onInput('ln(') },
        { label: 'sqrt', onClick: () => onInput('sqrt(') },
        { label: 'π', onClick: () => onInput('π') },
        { label: 'e', onClick: () => onInput('e') },
        { label: 'x²', onClick: () => onInput('^2') },
        { label: 'xʸ', onClick: () => onInput('^') },
        { label: '(', onClick: () => onInput('(') },
        { label: ')', onClick: () => onInput(')') },
    ]

    const programmerButtons = [
        { label: 'AND', onClick: () => onInput('&') },
        { label: 'OR', onClick: () => onInput('|') },
        { label: 'XOR', onClick: () => onInput('^') },
        { label: 'NOT', onClick: () => onInput('~') },
        { label: '<<', onClick: () => onInput('<<') },
        { label: '>>', onClick: () => onInput('>>') },
        { label: 'HEX', onClick: () => onInput('0x') },
        { label: 'BIN', onClick: () => onInput('0b') },
        { label: 'A', onClick: () => onInput('A') },
        { label: 'B', onClick: () => onInput('B') },
        { label: 'C', onClick: () => onInput('C') },
        { label: 'D', onClick: () => onInput('D') },
        { label: 'E', onClick: () => onInput('E') },
        { label: 'F', onClick: () => onInput('F') },
    ]

    const memoryButtons = [
        { label: 'MC', onClick: onMemoryClear, title: 'Memory Clear' },
        { label: 'MR', onClick: onMemoryRecall, title: 'Memory Recall' },
        { label: 'M+', onClick: onMemoryAdd, title: 'Memory Add' },
        { label: 'M-', onClick: onMemorySubtract, title: 'Memory Subtract' },
        { label: 'MS', onClick: onMemoryStore, title: 'Memory Store' },
    ]

    return (
        <div className="flex-1 p-4 overflow-auto">
            <div className="max-w-4xl mx-auto">
                {/* Memory Buttons */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                    {memoryButtons.map((btn) => (
                        <button
                            key={btn.label}
                            onClick={btn.onClick}
                            title={btn.title}
                            className="p-2 text-sm rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--button-active)] text-[var(--text-primary)] font-medium transition-colors border border-[var(--border-color)]"
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Scientific/Programmer Functions */}
                {mode === 'scientific' && (
                    <div className="grid grid-cols-6 gap-2 mb-3">
                        {scientificButtons.map((btn) => (
                            <button
                                key={btn.label}
                                onClick={btn.onClick}
                                className="p-2 text-sm rounded-lg bg-[var(--button-bg)] hover:bg-[var(--button-hover)] text-[var(--text-primary)] font-medium transition-colors border border-[var(--border-color)]"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                )}

                {mode === 'programmer' && (
                    <div className="grid grid-cols-7 gap-1.5 mb-3">
                        {programmerButtons.map((btn) => (
                            <button
                                key={btn.label}
                                onClick={btn.onClick}
                                className="p-1.5 rounded-lg bg-[var(--button-bg)] hover:bg-[var(--button-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors border border-[var(--border-color)]"
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Number Pad */}
                <div className="grid grid-cols-4 gap-2">
                    {/* Numbers (arranged in 3x3 grid plus 0) */}
                    {numberLayout.slice(0, 9).map((num, index) => (
                        <button
                            key={`num-${index}`}
                            onClick={() => handleButtonClick(num, () => onInput(num))}
                            className={`p-4 rounded-lg bg-[var(--button-bg)] hover:bg-[var(--button-hover)] active:bg-[var(--button-active)] text-[var(--text-primary)] text-xl font-semibold transition-all border border-[var(--border-color)] ${isAnimating ? 'animate-shuffle' : ''
                                } ${pressedButton === num ? 'animate-button-press' : ''}`}
                        >
                            {num}
                        </button>
                    ))}

                    {/* 0 button (special positioning) */}
                    <button
                        onClick={() => handleButtonClick(numberLayout[9], () => onInput(numberLayout[9]))}
                        className={`p-4 rounded-lg bg-[var(--button-bg)] hover:bg-[var(--button-hover)] active:bg-[var(--button-active)] text-[var(--text-primary)] text-xl font-semibold transition-all border border-[var(--border-color)] col-span-2 ${isAnimating ? 'animate-shuffle' : ''
                            } ${pressedButton === numberLayout[9] ? 'animate-button-press' : ''}`}
                    >
                        {numberLayout[9]}
                    </button>

                    {/* Operators and special buttons */}
                    {baseButtons.map((btn, index) => (
                        <button
                            key={`base-${index}`}
                            onClick={() => handleButtonClick(btn.label, btn.onClick)}
                            className={`p-4 rounded-lg ${btn.className} text-lg font-semibold transition-all ${btn.className.includes('bg-red') || btn.className.includes('bg-green') || btn.className.includes('bg-[var(--accent)]')
                                    ? 'border-transparent'
                                    : 'border border-[var(--border-color)]'
                                } ${btn.className.includes('col-span') ? '' : ''} ${pressedButton === btn.label ? 'animate-button-press' : ''}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
