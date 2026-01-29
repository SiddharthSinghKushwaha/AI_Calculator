export interface Variable {
    name: string
    value: string
}

export class VariableManager {
    private variables: Map<string, string> = new Map()

    constructor() {
        // Variables are managed in-memory, session context handled at App level
    }

    /**
     * Validate variable name (must be a valid identifier)
     */
    private isValidVariableName(name: string): boolean {
        // Must start with letter or underscore, followed by letters, numbers, or underscores
        // Must not be a number
        const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/
        return pattern.test(name)
    }

    /**
     * Set a variable
     */
    setVariable(name: string, value: string): boolean {
        const trimmedName = name.trim()

        if (!this.isValidVariableName(trimmedName)) {
            throw new Error(`Invalid variable name: ${name}`)
        }

        this.variables.set(trimmedName, value)
        return true
    }

    /**
     * Get a variable value
     */
    getVariable(name: string): string | null {
        return this.variables.get(name.trim()) || null
    }

    /**
     * Get all variables
     */
    getAllVariables(): Variable[] {
        return Array.from(this.variables.entries()).map(([name, value]) => ({
            name,
            value
        }))
    }

    /**
     * Check if a variable exists
     */
    hasVariable(name: string): boolean {
        return this.variables.has(name.trim())
    }

    /**
     * Delete a variable
     */
    deleteVariable(name: string): boolean {
        return this.variables.delete(name.trim())
    }

    /**
     * Clear all variables
     */
    clearAll(): void {
        this.variables.clear()
    }

    /**
     * Load variables from array
     */
    loadVariables(vars: Variable[]): void {
        this.variables.clear()
        vars.forEach(v => {
            this.variables.set(v.name, v.value)
        })
    }

    /**
     * Get variable count
     */
    getCount(): number {
        return this.variables.size
    }
}
