export class MemoryManager {
    private memorySlots: Map<string, string> = new Map()
    private currentMemory: string = '0'

    constructor() {
        this.initializeSlots()
    }

    private initializeSlots(): void {
        this.memorySlots.set('M1', '0')
        this.memorySlots.set('M2', '0')
        this.memorySlots.set('M3', '0')
        this.memorySlots.set('M4', '0')
    }

    // Memory Add
    memoryAdd(value: string): void {
        const current = parseFloat(this.currentMemory) || 0
        const add = parseFloat(value) || 0
        this.currentMemory = (current + add).toString()
    }

    // Memory Subtract
    memorySubtract(value: string): void {
        const current = parseFloat(this.currentMemory) || 0
        const subtract = parseFloat(value) || 0
        this.currentMemory = (current - subtract).toString()
    }

    // Memory Recall
    memoryRecall(): string {
        return this.currentMemory
    }

    // Memory Clear
    memoryClear(): void {
        this.currentMemory = '0'
    }

    // Memory Store
    memoryStore(value: string): void {
        this.currentMemory = value
    }

    // Slot operations
    storeInSlot(slot: string, value: string): void {
        this.memorySlots.set(slot, value)
    }

    recallFromSlot(slot: string): string {
        return this.memorySlots.get(slot) || '0'
    }

    clearSlot(slot: string): void {
        this.memorySlots.set(slot, '0')
    }

    getAllSlots(): Map<string, string> {
        return new Map(this.memorySlots)
    }

    hasMemory(): boolean {
        return this.currentMemory !== '0'
    }
}
