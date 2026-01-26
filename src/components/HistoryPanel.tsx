import { useState } from 'react'
import { HistoryEntry } from '../types'

interface HistoryPanelProps {
    history: HistoryEntry[]
    onHistoryClick: (entry: HistoryEntry) => void
    onRefresh: () => void
}

export default function HistoryPanel({ history, onHistoryClick, onRefresh }: HistoryPanelProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>(history)

    const handleSearch = async (query: string) => {
        setSearchQuery(query)

        if (!query.trim()) {
            setFilteredHistory(history)
            return
        }

        if (window.electronAPI) {
            const results = await window.electronAPI.searchHistory(query, 100)
            setFilteredHistory(results)
        }
    }

    const handlePin = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        if (window.electronAPI) {
            await window.electronAPI.togglePin(id)
            onRefresh()
        }
    }

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        if (window.electronAPI) {
            await window.electronAPI.deleteHistory(id)
            onRefresh()
        }
    }

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    const displayHistory = searchQuery ? filteredHistory : history

    return (
        <div className="w-80 bg-[var(--history-bg)] border-r border-[var(--border-color)] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">History</h2>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search calculations..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto">
                {displayHistory.length === 0 ? (
                    <div className="p-4 text-center text-[var(--text-secondary)]">
                        {searchQuery ? 'No results found' : 'No calculations yet'}
                    </div>
                ) : (
                    <div className="p-2">
                        {displayHistory.map((entry) => (
                            <div
                                key={entry.id}
                                onClick={() => onHistoryClick(entry)}
                                className="group p-3 mb-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="text-xs text-[var(--text-secondary)]">
                                        {formatTimestamp(entry.timestamp)}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handlePin(e, entry.id!)}
                                            className="p-1 hover:bg-[var(--button-active)] rounded"
                                            title={entry.is_pinned ? 'Unpin' : 'Pin'}
                                        >
                                            {entry.is_pinned ? '📌' : '📍'}
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, entry.id!)}
                                            className="p-1 hover:bg-red-500 hover:text-white rounded"
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className="text-sm text-[var(--text-primary)] font-mono mb-1 truncate">
                                    {entry.expression}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-semibold text-[var(--accent)] font-mono truncate">
                                        = {entry.result}
                                    </span>
                                    <span className="text-xs text-[var(--text-secondary)] ml-2 flex-shrink-0">
                                        {entry.mode}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--border-color)]">
                <button
                    onClick={onRefresh}
                    className="w-full py-2 px-4 rounded-lg bg-[var(--button-bg)] hover:bg-[var(--button-hover)] text-[var(--text-primary)] font-medium transition-colors"
                >
                    Refresh
                </button>
            </div>
        </div>
    )
}
