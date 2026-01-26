import { Theme } from '../types'

interface SettingsPanelProps {
    theme: Theme
    scatteredKeypad: boolean
    onThemeChange: (theme: Theme) => void
    onScatteredKeypadToggle: (enabled: boolean) => void
    onClose: () => void
}

export default function SettingsPanel({
    theme,
    scatteredKeypad,
    onThemeChange,
    onScatteredKeypadToggle,
    onClose,
}: SettingsPanelProps) {
    const handleClearHistory = async () => {
        if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            if (window.electronAPI) {
                await window.electronAPI.clearHistory()
                window.location.reload()
            }
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-primary)] rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                    <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--button-hover)] text-[var(--text-primary)]"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Theme Setting */}
                    <div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Theme</h3>
                        <div className="space-y-2">
                            {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                                <label
                                    key={t}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={t}
                                        checked={theme === t}
                                        onChange={() => onThemeChange(t)}
                                        className="w-4 h-4 accent-[var(--accent)]"
                                    />
                                    <span className="text-[var(--text-primary)] capitalize">{t}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Scattered Keypad */}
                    <div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">Keypad Layout</h3>
                        <label className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors">
                            <div>
                                <div className="font-medium text-[var(--text-primary)]">Scattered Keypad</div>
                                <div className="text-sm text-[var(--text-secondary)] mt-1">
                                    Randomize number positions on launch
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={scatteredKeypad}
                                onChange={(e) => onScatteredKeypadToggle(e.target.checked)}
                                className="w-5 h-5 accent-[var(--accent)]"
                            />
                        </label>
                    </div>

                    {/* History Management */}
                    <div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">History</h3>
                        <button
                            onClick={handleClearHistory}
                            className="w-full py-3 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                        >
                            Clear All History
                        </button>
                        <p className="text-xs text-[var(--text-secondary)] mt-2">
                            This will permanently delete all calculation history. Pinned items will also be removed.
                        </p>
                    </div>

                    {/* About */}
                    <div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-3">About</h3>
                        <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                            <div className="text-[var(--text-primary)] font-semibold mb-1">
                                Advanced Calculator
                            </div>
                            <div className="text-sm text-[var(--text-secondary)]">
                                Version 1.0.0
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] mt-2">
                                A professional-grade calculator with persistent history and advanced features.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--border-color)]">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    )
}
