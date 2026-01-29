import { Session } from '../types'
import { useState } from 'react'

interface SessionSelectorProps {
    sessions: Session[]
    currentSessionId: number | null
    onSessionChange: (sessionId: number) => void
    onCreateSession: (name: string) => void
    onRenameSession: (id: number, newName: string) => void
    onDeleteSession: (id: number) => void
}

export default function SessionSelector({
    sessions,
    currentSessionId,
    onSessionChange,
    onCreateSession,
    onRenameSession,
    onDeleteSession
}: SessionSelectorProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [newSessionName, setNewSessionName] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

    const currentSession = sessions.find(s => s.id === currentSessionId)

    const handleCreateSession = () => {
        if (newSessionName.trim()) {
            onCreateSession(newSessionName.trim())
            setNewSessionName('')
            setIsCreating(false)
        }
    }

    const handleRenameSession = (id: number) => {
        if (editName.trim()) {
            onRenameSession(id, editName.trim())
            setEditingId(null)
            setEditName('')
        }
    }

    const startRename = (session: Session) => {
        setEditingId(session.id!)
        setEditName(session.name)
    }

    return (
        <div className="relative">
            {/* Session Selector Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded bg-[var(--button-bg)] hover:bg-[var(--button-hover)] text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
            >
                <span className="text-sm font-medium">
                    📁 {currentSession?.name || 'Default'}
                </span>
                <span className="text-xs">▼</span>
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute top-full mt-2 right-0 w-64 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded shadow-lg z-20 overflow-hidden">
                        {/* Sessions List */}
                        <div className="max-h-64 overflow-y-auto">
                            {sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`flex items-center justify-between p-3 hover:bg-[var(--button-hover)] transition-colors ${session.id === currentSessionId ? 'bg-[var(--button-bg)]' : ''
                                        }`}
                                >
                                    {editingId === session.id ? (
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRenameSession(session.id!)
                                                    if (e.key === 'Escape') setEditingId(null)
                                                }}
                                                className="flex-1 px-2 py-1 text-sm bg-[var(--display-bg)] border border-[var(--accent)] rounded focus:outline-none text-[var(--text-primary)]"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleRenameSession(session.id!)}
                                                className="text-green-500 hover:text-green-600"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    onSessionChange(session.id!)
                                                    setShowDropdown(false)
                                                }}
                                                className="flex-1 text-left text-sm text-[var(--text-primary)]"
                                            >
                                                {session.name}
                                                {session.is_default === 1 && (
                                                    <span className="ml-2 text-xs text-[var(--text-secondary)]">(default)</span>
                                                )}
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => startRename(session)}
                                                    className="p-1 text-xs hover:text-[var(--accent)]"
                                                    title="Rename"
                                                >
                                                    ✏️
                                                </button>
                                                {session.is_default !== 1 && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Delete session "${session.name}"?`)) {
                                                                onDeleteSession(session.id!)
                                                            }
                                                        }}
                                                        className="p-1 text-xs hover:text-red-500"
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Create New Session */}
                        <div className="border-t border-[var(--border-color)] p-3">
                            {isCreating ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={newSessionName}
                                        onChange={(e) => setNewSessionName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateSession()
                                            if (e.key === 'Escape') setIsCreating(false)
                                        }}
                                        placeholder="Session name"
                                        className="flex-1 px-2 py-1 text-sm bg-[var(--display-bg)] border border-[var(--accent)] rounded focus:outline-none text-[var(--text-primary)]"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleCreateSession}
                                        className="text-green-500 hover:text-green-600"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsCreating(false)
                                            setNewSessionName('')
                                        }}
                                        className="text-red-500 hover:text-red-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full text-sm text-[var(--accent)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    + New Session
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
