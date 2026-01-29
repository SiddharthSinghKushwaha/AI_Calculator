import { Session } from '../types'

export class SessionManager {
    private currentSessionId: number | null = null
    private sessions: Session[] = []

    /**
     * Get the current session ID
     */
    getCurrentSessionId(): number | null {
        return this.currentSessionId
    }

    /**
     * Set the current session ID
     */
    setCurrentSessionId(id: number): void {
        this.currentSessionId = id
    }

    /**
     * Get all sessions
     */
    getSessions(): Session[] {
        return this.sessions
    }

    /**
     * Load sessions from database
     */
    loadSessions(sessions: Session[]): void {
        this.sessions = sessions

        // If no current session, set to default or first session
        if (!this.currentSessionId && sessions.length > 0) {
            const defaultSession = sessions.find(s => s.is_default === 1)
            this.currentSessionId = defaultSession?.id ?? sessions[0].id ?? null
        }
    }

    /**
     * Add a new session to the local cache
     */
    addSession(session: Session): void {
        this.sessions.push(session)
    }

    /**
     * Update a session in the local cache
     */
    updateSession(id: number, updates: Partial<Session>): void {
        const index = this.sessions.findIndex(s => s.id === id)
        if (index !== -1) {
            this.sessions[index] = { ...this.sessions[index], ...updates }
        }
    }

    /**
     * Remove a session from the local cache
     */
    removeSession(id: number): void {
        this.sessions = this.sessions.filter(s => s.id !== id)

        // If we deleted the current session, switch to another
        if (this.currentSessionId === id && this.sessions.length > 0) {
            const defaultSession = this.sessions.find(s => s.is_default === 1)
            this.currentSessionId = defaultSession?.id ?? this.sessions[0].id ?? null
        }
    }

    /**
     * Get a session by ID
     */
    getSessionById(id: number): Session | null {
        return this.sessions.find(s => s.id === id) || null
    }

    /**
     * Get current session
     */
    getCurrentSession(): Session | null {
        if (!this.currentSessionId) return null
        return this.getSessionById(this.currentSessionId)
    }
}
