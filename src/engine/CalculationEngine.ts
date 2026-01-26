import { create, all, MathJsInstance } from 'mathjs'

export class CalculationEngine {
    private math: MathJsInstance
    private mode: 'standard' | 'scientific' | 'programmer' = 'standard'

    constructor() {
        this.math = create(all, {
            number: 'BigNumber',
            precision: 64
        })
    }

    setMode(mode: 'standard' | 'scientific' | 'programmer'): void {
        this.mode = mode
    }

    getMode(): string {
        return this.mode
    }

    evaluate(expression: string): string {
        try {
            // Clean and validate expression
            const cleaned = this.preprocessExpression(expression)

            // Evaluate based on mode
            let result: any

            if (this.mode === 'programmer') {
                result = this.evaluateProgrammer(cleaned)
            } else {
                result = this.math.evaluate(cleaned)
            }

            // Format result
            return this.formatResult(result)
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(this.formatError(error.message))
            }
            throw new Error('Invalid expression')
        }
    }

    private preprocessExpression(expr: string): string {
        let processed = expr.trim()

        // Replace × and ÷ with * and /
        processed = processed.replace(/×/g, '*').replace(/÷/g, '/')

        // Skip implicit multiplication and constant replacement for programmer mode
        if (this.mode !== 'programmer') {
            // Handle implicit multiplication (2π → 2*π)
            processed = processed.replace(/(\d)([a-zA-Z])/g, '$1*$2')
            processed = processed.replace(/(\))(\d)/g, '$1*$2')
            processed = processed.replace(/(\d)(\()/g, '$1*$2')

            // Replace constants
            processed = processed.replace(/π/g, 'pi')
            processed = processed.replace(/е/g, 'e')
        }

        return processed
    }

    private evaluateProgrammer(expr: string): any {
        console.log('evaluateProgrammer called with:', expr)

        // Convert all hex and binary numbers to decimal first
        let processed = expr

        // Replace standalone hex letters (A-F) with their decimal values
        // This allows typing "E-B" to work as "14-11"
        processed = processed.replace(/\b([A-F])\b/g, (_match, letter) => {
            const decimal = parseInt(letter, 16).toString()
            console.log(`Converting standalone hex letter ${letter} to decimal ${decimal}`)
            return decimal
        })

        // Replace all hex numbers (0xABCD) with their decimal equivalents
        processed = processed.replace(/0x([0-9A-Fa-f]+)/g, (_match, hex) => {
            const decimal = parseInt(hex, 16).toString()
            console.log(`Converting hex 0x${hex} to decimal ${decimal}`)
            return decimal
        })

        // Replace all binary numbers (0b1010) with their decimal equivalents
        processed = processed.replace(/0b([01]+)/g, (_match, bin) => {
            const decimal = parseInt(bin, 2).toString()
            console.log(`Converting binary 0b${bin} to decimal ${decimal}`)
            return decimal
        })

        // Replace all octal numbers (0o777) with their decimal equivalents
        processed = processed.replace(/0o([0-7]+)/g, (_match, oct) => {
            const decimal = parseInt(oct, 8).toString()
            console.log(`Converting octal 0o${oct} to decimal ${decimal}`)
            return decimal
        })

        console.log('Processed expression:', processed)

        // Now evaluate the expression with bitwise operators
        // Check if it contains bitwise operators
        if (processed.includes('&') || processed.includes('|') || processed.includes('^') ||
            processed.includes('<<') || processed.includes('>>') || processed.includes('~')) {
            console.log('Using bitwise evaluation')
            return this.evaluateBitwise(processed)
        }

        // Otherwise use math.js for regular arithmetic
        console.log('Using math.js evaluation')
        return this.math.evaluate(processed)
    }

    private evaluateBitwise(expr: string): number {
        try {
            // Handle ~ (NOT) operator - needs special handling
            let processed = expr

            // Replace ~ with bitwise NOT
            // Match ~number patterns
            processed = processed.replace(/~(\d+)/g, (_match, num) => {
                return (~parseInt(num)).toString()
            })

            // Now safely evaluate the expression with JavaScript's bitwise operators
            // Only allow numbers and bitwise operators
            const sanitized = processed.replace(/[^0-9&|^<>()\ \-+*/]/g, '')

            // Use Function constructor instead of eval for safer evaluation
            const func = new Function('return ' + sanitized)
            return func()
        } catch {
            throw new Error('Invalid bitwise operation')
        }
    }

    private formatResult(result: any): string {
        if (typeof result === 'number') {
            // Handle very large or very small numbers
            if (Math.abs(result) > 1e15 || (Math.abs(result) < 1e-6 && result !== 0)) {
                return result.toExponential(10)
            }
            return result.toString()
        }

        if (result && typeof result.toString === 'function') {
            return result.toString()
        }

        return String(result)
    }

    private formatError(message: string): string {
        if (message.includes('Undefined symbol')) {
            return 'Undefined function or variable'
        }
        if (message.includes('division by zero')) {
            return 'Cannot divide by zero'
        }
        if (message.includes('Unexpected')) {
            return 'Syntax error'
        }
        return 'Invalid expression'
    }

    // Scientific functions
    sin(value: number): number {
        return Math.sin(value)
    }

    cos(value: number): number {
        return Math.cos(value)
    }

    tan(value: number): number {
        return Math.tan(value)
    }

    log(value: number): number {
        return Math.log10(value)
    }

    ln(value: number): number {
        return Math.log(value)
    }

    sqrt(value: number): number {
        return Math.sqrt(value)
    }

    square(value: number): number {
        return value * value
    }

    power(base: number, exponent: number): number {
        return Math.pow(base, exponent)
    }

    factorial(n: number): number {
        if (n < 0) throw new Error('Factorial of negative number')
        if (n === 0 || n === 1) return 1
        return n * this.factorial(n - 1)
    }

    // Programmer mode functions
    toHex(value: number): string {
        return '0x' + value.toString(16).toUpperCase()
    }

    toBinary(value: number): string {
        return '0b' + value.toString(2)
    }

    toOctal(value: number): string {
        return '0o' + value.toString(8)
    }

    bitwiseAnd(a: number, b: number): number {
        return a & b
    }

    bitwiseOr(a: number, b: number): number {
        return a | b
    }

    bitwiseXor(a: number, b: number): number {
        return a ^ b
    }

    bitwiseNot(a: number): number {
        return ~a
    }

    leftShift(a: number, bits: number): number {
        return a << bits
    }

    rightShift(a: number, bits: number): number {
        return a >> bits
    }
}
