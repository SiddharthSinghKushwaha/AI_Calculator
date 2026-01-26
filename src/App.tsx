import { useState, useEffect, useCallback } from 'react'
import { CalculationEngine } from './engine/CalculationEngine'
import { MemoryManager } from './engine/MemoryManager'
import { CalculationMode, Theme, HistoryEntry } from './types'
import DisplayPanel from './components/DisplayPanel'
import InputPanel from './components/InputPanel'
import HistoryPanel from './components/HistoryPanel'
import SettingsPanel from './components/SettingsPanel'

function App() {
    const [expression, setExpression] = useState<string>('')
    const [result, setResult] = useState<string>('0')
    const [mode, setMode] = useState<CalculationMode>('standard')
    const [theme, setTheme] = useState<Theme>('system')
    const [scatteredKeypad, setScatteredKeypad] = useState<boolean>(false)
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [showSettings, setShowSettings] = useState<boolean>(false)
    const [engine] = useState(() => new CalculationEngine())
    const [memoryManager] = useState(() => new MemoryManager())

    const [isNewCalculation, setIsNewCalculation] = useState<boolean>(false)

    // Load settings on startup
    useEffect(() => {
        loadSettings()
        loadHistory()
    }, [])

    // Apply theme
    useEffect(() => {
        applyTheme()
    }, [theme])

    // Auto-clear result when expression is empty
    useEffect(() => {
        if (expression === '' && result !== '0') {
            setResult('0')
        }
    }, [expression])

    // Real-time calculation
    useEffect(() => {
        if (!expression.trim() || isNewCalculation) return

        try {
            // Only calculate if the expression ends with a number or closing parenthesis
            // to avoid errors while typing operators
            if (/[\d)]$/.test(expression)) {
                engine.setMode(mode)
                const calculatedResult = engine.evaluate(expression)
                setResult(calculatedResult)
            }
        } catch (error) {
            // Ignore errors during typing (incomplete expressions)
        }
    }, [expression, mode, engine, isNewCalculation])

    const loadSettings = async () => {
        if (window.electronAPI) {
            const settings = await window.electronAPI.getAllSettings()
            setTheme((settings.theme as Theme) || 'system')
            setScatteredKeypad(settings.scatteredKeypad === 'true')
            setMode((settings.calculationMode as CalculationMode) || 'standard')
        }
    }

    const loadHistory = async () => {
        if (window.electronAPI) {
            const historyData = await window.electronAPI.getHistory(100, 0)
            setHistory(historyData)
        }
    }

    const applyTheme = () => {
        const root = document.documentElement

        if (theme === 'dark') {
            root.classList.add('dark')
        } else if (theme === 'light') {
            root.classList.remove('dark')
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            if (prefersDark) {
                root.classList.add('dark')
            } else {
                root.classList.remove('dark')
            }
        }
    }

    const handleInput = (value: string) => {
        if (isNewCalculation) {
            const isOperator = ['+', '-', '*', '/'].includes(value)
            if (isOperator) {
                // Continue calculation with result
                setExpression(result + value)
            } else {
                // Start new calculation
                setExpression(value)
            }
            setIsNewCalculation(false)
        } else {
            setExpression(prev => prev + value)
        }
    }

    const handleExpressionChange = (newExpression: string) => {
        setExpression(newExpression)
        setIsNewCalculation(false)
    }

    const handleClear = () => {
        setExpression('')
        setResult('0')
        setIsNewCalculation(false)
    }

    const handleBackspace = () => {
        if (isNewCalculation) {
            setExpression('')
            setResult('0')
            setIsNewCalculation(false)
            return
        }
        setExpression(prev => {
            const newExpression = prev.slice(0, -1)
            // If expression becomes empty, reset result to 0
            if (newExpression === '') {
                setResult('0')
            }
            return newExpression
        })
    }

    const handleCalculate = useCallback(async () => {
        if (!expression.trim()) return

        try {
            engine.setMode(mode)
            const calculatedResult = engine.evaluate(expression)
            setResult(calculatedResult)
            setIsNewCalculation(true)

            // Save to history
            if (window.electronAPI) {
                const entry: HistoryEntry = {
                    expression,
                    result: calculatedResult,
                    mode,
                    timestamp: Date.now(),
                    is_pinned: 0,
                }
                await window.electronAPI.addHistory(entry)
                loadHistory()
            }
        } catch (error) {
            setResult(error instanceof Error ? error.message : 'Error')
            setIsNewCalculation(true)
        }
    }, [expression, mode, engine])

    const handleModeChange = async (newMode: CalculationMode) => {
        setMode(newMode)
        engine.setMode(newMode)
        if (window.electronAPI) {
            await window.electronAPI.setSetting('calculationMode', newMode)
        }
    }

    const handleThemeChange = async (newTheme: Theme) => {
        setTheme(newTheme)
        if (window.electronAPI) {
            await window.electronAPI.setSetting('theme', newTheme)
        }
    }

    const handleScatteredKeypadToggle = async (enabled: boolean) => {
        setScatteredKeypad(enabled)
        if (window.electronAPI) {
            await window.electronAPI.setSetting('scatteredKeypad', enabled.toString())
        }
    }

    const handleHistoryClick = (entry: HistoryEntry) => {
        setExpression(entry.expression)
        setResult(entry.result)
        setMode(entry.mode)
        setIsNewCalculation(false)
    }

    const handleMemoryAdd = () => {
        memoryManager.memoryAdd(result)
    }

    const handleMemorySubtract = () => {
        memoryManager.memorySubtract(result)
    }

    const handleMemoryRecall = () => {
        const value = memoryManager.memoryRecall()
        if (isNewCalculation) {
            setExpression(value)
            setIsNewCalculation(false)
        } else {
            setExpression(prev => prev + value)
        }
    }

    const handleMemoryClear = () => {
        memoryManager.memoryClear()
    }

    const handleMemoryStore = () => {
        memoryManager.memoryStore(result)
    }

    const handlePaste = (text: string) => {
        if (isNewCalculation) {
            setExpression(text)
            setIsNewCalculation(false)
        } else {
            setExpression(prev => prev + text)
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input (except for specific cases)
            const activeElement = document.activeElement as HTMLElement
            const isInputActive = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA'

            // Copy result with Ctrl+C (when not in input field)
            if (e.ctrlKey && e.key === 'c' && !isInputActive) {
                e.preventDefault()
                navigator.clipboard.writeText(result)
            }
            // Paste with Ctrl+V
            else if (e.ctrlKey && e.key === 'v' && !isInputActive) {
                e.preventDefault()
                navigator.clipboard.readText().then(text => {
                    handlePaste(text)
                })
            }
            // Number keys
            else if (e.key >= '0' && e.key <= '9' && !isInputActive) {
                handleInput(e.key)
            }
            // Operators
            else if ((e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') && !isInputActive) {
                handleInput(e.key)
            }
            // Decimal point
            else if (e.key === '.' && !isInputActive) {
                handleInput('.')
            }
            // Enter to calculate
            else if (e.key === 'Enter') {
                e.preventDefault()
                handleCalculate()
            }
            // Backspace
            else if (e.key === 'Backspace') {
                // Only handle backspace manually if NOT in an input field
                if (!isInputActive) {
                    e.preventDefault()
                    handleBackspace()
                }
            }
            // Escape to clear
            else if (e.key === 'Escape') {
                handleClear()
            }
            // Ctrl+, for settings
            else if (e.ctrlKey && e.key === ',') {
                e.preventDefault()
                setShowSettings(true)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [expression, result, handleCalculate, isNewCalculation])

    return (
        <div className="flex h-screen bg-[var(--bg-primary)]">
            {/* History Panel */}
            <HistoryPanel
                history={history}
                onHistoryClick={handleHistoryClick}
                onRefresh={loadHistory}
            />

            {/* Main Calculator Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                    <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                        Advanced Calculator
                    </h1>
                    <div className="flex items-center gap-4">
                        {/* Mode Selector */}
                        <div className="flex gap-2">
                            {(['standard', 'scientific', 'programmer'] as CalculationMode[]).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => handleModeChange(m)}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${mode === m
                                        ? 'bg-[var(--accent)] text-white'
                                        : 'bg-[var(--button-bg)] text-[var(--text-primary)] hover:bg-[var(--button-hover)]'
                                        }`}
                                >
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Settings Button */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded hover:bg-[var(--button-hover)] text-[var(--text-primary)]"
                            title="Settings (Ctrl+,)"
                        >
                            ⚙️
                        </button>
                    </div>
                </div>

                {/* Display Panel */}
                <DisplayPanel
                    expression={expression}
                    result={result}
                    mode={mode}
                    hasMemory={memoryManager.hasMemory()}
                    onPaste={handlePaste}
                    onChange={handleExpressionChange}
                />

                {/* Input Panel */}
                <InputPanel
                    mode={mode}
                    scatteredKeypad={scatteredKeypad}
                    onInput={handleInput}
                    onClear={handleClear}
                    onBackspace={handleBackspace}
                    onCalculate={handleCalculate}
                    onMemoryAdd={handleMemoryAdd}
                    onMemorySubtract={handleMemorySubtract}
                    onMemoryRecall={handleMemoryRecall}
                    onMemoryClear={handleMemoryClear}
                    onMemoryStore={handleMemoryStore}
                />
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <SettingsPanel
                    theme={theme}
                    scatteredKeypad={scatteredKeypad}
                    onThemeChange={handleThemeChange}
                    onScatteredKeypadToggle={handleScatteredKeypadToggle}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    )
}

export default App
