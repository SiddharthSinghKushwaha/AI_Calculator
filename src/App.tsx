import { useState, useEffect, useCallback } from 'react'
import { CalculationEngine } from './engine/CalculationEngine'
import { MemoryManager } from './engine/MemoryManager'
import { VariableManager } from './engine/VariableManager'
import { SessionManager } from './engine/SessionManager'
import { CalculationMode, Theme, HistoryEntry, Session, Variable, NumberFormat } from './types'
import DisplayPanel from './components/DisplayPanel'
import InputPanel from './components/InputPanel'
import HistoryPanel from './components/HistoryPanel'
import SettingsPanel from './components/SettingsPanel'
import SessionSelector from './components/SessionSelector'
import VariablesPanel from './components/VariablesPanel'

function App() {
    const [expression, setExpression] = useState<string>('')
    const [result, setResult] = useState<string>('0')
    const [mode, setMode] = useState<CalculationMode>('standard')
    const [theme, setTheme] = useState<Theme>('system')
    const [scatteredKeypad, setScatteredKeypad] = useState<boolean>(false)
    const [numberFormat, setNumberFormat] = useState<NumberFormat>('international')
    const [ghostMode, setGhostMode] = useState<boolean>(false)
    const [history, setHistory] = useState<HistoryEntry[]>([])
    const [sessions, setSessions] = useState<Session[]>([])
    const [variables, setVariables] = useState<Variable[]>([])
    const [showSettings, setShowSettings] = useState<boolean>(false)
    const [engine] = useState(() => new CalculationEngine())
    const [memoryManager] = useState(() => new MemoryManager())
    const [variableManager] = useState(() => new VariableManager())
    const [sessionManager] = useState(() => new SessionManager())

    const [isNewCalculation, setIsNewCalculation] = useState<boolean>(false)

    // Load settings and data on startup
    useEffect(() => {
        engine.setVariableManager(variableManager)
        loadSettings()
        loadSessions()
    }, [])

    // Load session data when current session changes
    useEffect(() => {
        const currentSessionId = sessionManager.getCurrentSessionId()
        if (currentSessionId) {
            loadHistory()
            loadVariables()
        }
    }, [sessionManager.getCurrentSessionId()])

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
            setNumberFormat((settings.numberFormat as NumberFormat) || 'international')
            const ghostEnabled = settings.ghostMode === 'true'
            setGhostMode(ghostEnabled)
            if (window.electronAPI.setGhostMode) {
                await window.electronAPI.setGhostMode(ghostEnabled)
            }
        }
    }

    const loadSessions = async () => {
        if (window.electronAPI) {
            const sessionsData = await window.electronAPI.getSessions()
            console.log('Sessions loaded:', sessionsData)
            setSessions(sessionsData)
            sessionManager.loadSessions(sessionsData)

            // Load history and variables for the current session
            const currentSessionId = sessionManager.getCurrentSessionId()
            console.log('Current session after load:', currentSessionId)
            if (currentSessionId) {
                await loadHistory()
                await loadVariables()
            }
        }
    }

    const loadHistory = async () => {
        if (window.electronAPI) {
            const currentSessionId = sessionManager.getCurrentSessionId()
            console.log('Loading history for session:', currentSessionId)
            const historyData = await window.electronAPI.getHistory(100, 0, currentSessionId || undefined)
            console.log('History data received:', historyData.length, 'entries')
            setHistory(historyData)
        }
    }

    const loadVariables = async () => {
        if (window.electronAPI) {
            const currentSessionId = sessionManager.getCurrentSessionId()
            if (currentSessionId) {
                const variablesData = await window.electronAPI.getVariables(currentSessionId)
                setVariables(variablesData)
                variableManager.loadVariables(variablesData)
            }
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

            // Check if expression has multiple lines
            const lines = expression.split('\n').map(line => line.trim()).filter(line => line.length > 0)

            if (lines.length > 1) {
                // Process each line separately
                let lastResult = '0'
                const variableAssignments: { name: string; value: string }[] = []

                for (const line of lines) {
                    const evaluation = engine.evaluateExpression(line)
                    lastResult = evaluation.result

                    // Collect variable assignments
                    if (evaluation.variableAssignment) {
                        variableAssignments.push(evaluation.variableAssignment)

                        // Save to database
                        const sessionId = sessionManager.getCurrentSessionId()
                        if (sessionId && window.electronAPI) {
                            await window.electronAPI.setVariable(
                                sessionId,
                                evaluation.variableAssignment.name,
                                evaluation.variableAssignment.value
                            )
                        }
                    }
                }

                // Update UI with last result
                setResult(lastResult)
                setIsNewCalculation(true)

                // Reload variables if any were created
                if (variableAssignments.length > 0) {
                    await loadVariables()
                }

                // Save to history
                if (window.electronAPI) {
                    const sessionId = sessionManager.getCurrentSessionId()
                    const recentHistory = await window.electronAPI.getHistory(1, 0, sessionId || undefined)
                    const isDuplicate = recentHistory.length > 0 &&
                        recentHistory[0].expression === expression &&
                        recentHistory[0].result === lastResult

                    if (!isDuplicate) {
                        const entry: HistoryEntry = {
                            expression,
                            result: lastResult,
                            mode,
                            timestamp: Date.now(),
                            is_pinned: 0,
                            session_id: sessionId || undefined,
                        }
                        await window.electronAPI.addHistory(entry)
                    }

                    await loadHistory()
                }
            } else {
                // Single line - process normally
                const evaluation = engine.evaluateExpression(expression)
                setResult(evaluation.result)
                setIsNewCalculation(true)

                // If this was a variable assignment, save it
                if (evaluation.variableAssignment && window.electronAPI) {
                    const sessionId = sessionManager.getCurrentSessionId()
                    if (sessionId) {
                        await window.electronAPI.setVariable(
                            sessionId,
                            evaluation.variableAssignment.name,
                            evaluation.variableAssignment.value
                        )
                        await loadVariables()
                    }
                }

                // Save to history (avoid duplicates)
                if (window.electronAPI) {
                    const sessionId = sessionManager.getCurrentSessionId()

                    // Check if the last history entry is the same
                    const recentHistory = await window.electronAPI.getHistory(1, 0, sessionId || undefined)
                    const isDuplicate = recentHistory.length > 0 &&
                        recentHistory[0].expression === expression &&
                        recentHistory[0].result === evaluation.result

                    if (!isDuplicate) {
                        const entry: HistoryEntry = {
                            expression,
                            result: evaluation.result,
                            mode,
                            timestamp: Date.now(),
                            is_pinned: 0,
                            session_id: sessionId || undefined,
                        }
                        await window.electronAPI.addHistory(entry)
                    }

                    // Always reload history to show updates
                    await loadHistory()
                }
            }
        } catch (error) {
            let errorMessage = error instanceof Error ? error.message : 'Error'

            // Check if it's a variable-related error
            if (errorMessage.includes('undefined') || errorMessage.includes('not defined')) {
                errorMessage = `Invalid expression. Need help with variables?\n\nVariable Syntax:\n• Define: variableName = value\n• Example: Tax = 200\n• Use: 5000 - Tax\n\nVariable names must start with a letter or underscore.`
            }

            setResult(errorMessage)
            setIsNewCalculation(true)
        }
    }, [expression, mode, engine, sessionManager, loadHistory, loadVariables])

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
            // Enter to calculate (but allow Shift+Enter in textarea for multiline)
            else if (e.key === 'Enter' && !e.shiftKey) {
                // If in textarea, let Shift+Enter add newlines
                if (isInputActive) {
                    e.preventDefault()
                    handleCalculate()
                } else {
                    e.preventDefault()
                    handleCalculate()
                }
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

    // Number format handler
    const handleNumberFormatChange = async (format: NumberFormat) => {
        setNumberFormat(format)
        if (window.electronAPI) {
            await window.electronAPI.setSetting('numberFormat', format)
        }
    }

    // Ghost mode handler
    const handleGhostModeToggle = async () => {
        const newGhostMode = !ghostMode
        setGhostMode(newGhostMode)
        if (window.electronAPI) {
            await window.electronAPI.setGhostMode(newGhostMode)
            await window.electronAPI.setSetting('ghostMode', newGhostMode.toString())
        }
    }

    // Session handlers
    const handleSessionChange = async (sessionId: number) => {
        sessionManager.setCurrentSessionId(sessionId)
        await loadHistory()
        await loadVariables()
    }

    const handleCreateSession = async (name: string) => {
        if (window.electronAPI) {
            const newId = await window.electronAPI.createSession(name)
            await loadSessions()
            if (newId) {
                sessionManager.setCurrentSessionId(newId)
                await loadHistory()
                await loadVariables()
            }
        }
    }

    const handleRenameSession = async (id: number, newName: string) => {
        if (window.electronAPI) {
            await window.electronAPI.renameSession(id, newName)
            await loadSessions()
        }
    }

    const handleDeleteSession = async (id: number) => {
        if (window.electronAPI) {
            const success = await window.electronAPI.deleteSession(id)
            if (success) {
                await loadSessions()
                const currentId = sessionManager.getCurrentSessionId()
                if (currentId) {
                    await loadHistory()
                    await loadVariables()
                }
            }
        }
    }

    // Variable handlers
    const handleDeleteVariable = async (id: number) => {
        if (window.electronAPI) {
            await window.electronAPI.deleteVariable(id)
            await loadVariables()
        }
    }

    const handleClearVariables = async () => {
        const sessionId = sessionManager.getCurrentSessionId()
        if (window.electronAPI && sessionId) {
            await window.electronAPI.clearVariables(sessionId)
            await loadVariables()
        }
    }

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
                        {/* Session Selector */}
                        <SessionSelector
                            sessions={sessions}
                            currentSessionId={sessionManager.getCurrentSessionId()}
                            onSessionChange={handleSessionChange}
                            onCreateSession={handleCreateSession}
                            onRenameSession={handleRenameSession}
                            onDeleteSession={handleDeleteSession}
                        />

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

                        {/* Ghost Mode Button */}
                        <button
                            onClick={handleGhostModeToggle}
                            className={`p-2 rounded hover:bg-[var(--button-hover)] transition-colors ${ghostMode ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}
                            title={`Ghost Mode ${ghostMode ? 'ON' : 'OFF'}`}
                        >
                            👻
                        </button>

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
                    numberFormat={numberFormat}
                    onPaste={handlePaste}
                    onChange={handleExpressionChange}
                    onNumberFormatChange={handleNumberFormatChange}
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

            {/* Variables Panel */}
            <div className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <VariablesPanel
                    variables={variables}
                    onDeleteVariable={handleDeleteVariable}
                    onClearAll={handleClearVariables}
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
