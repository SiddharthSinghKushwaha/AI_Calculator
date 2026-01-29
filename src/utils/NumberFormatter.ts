export type NumberFormat = 'international' | 'indian'

export class NumberFormatter {
    /**
     * Format a number string according to the specified format
     * @param value - The number as a string
     * @param format - 'international' or 'indian'
     * @returns Formatted number string
     */
    static format(value: string, format: NumberFormat = 'international'): string {
        if (!value || value === '0' || value === 'Error' || value.includes('Error')) {
            return value
        }

        // Handle scientific notation - don't format
        if (value.includes('e') || value.includes('E')) {
            return value
        }

        try {
            // Parse the number
            const num = parseFloat(value)
            if (isNaN(num)) {
                return value
            }

            // Split into integer and decimal parts
            const parts = value.split('.')
            const integerPart = parts[0]
            const decimalPart = parts[1] || ''

            // Handle negative numbers
            const isNegative = integerPart.startsWith('-')
            const absoluteInteger = isNegative ? integerPart.slice(1) : integerPart

            let formattedInteger: string

            if (format === 'indian') {
                formattedInteger = this.formatIndian(absoluteInteger)
            } else {
                formattedInteger = this.formatInternational(absoluteInteger)
            }

            // Add negative sign back if needed
            if (isNegative) {
                formattedInteger = '-' + formattedInteger
            }

            // Combine with decimal part if exists
            return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger
        } catch (error) {
            // If any error, return original value
            return value
        }
    }

    /**
     * Format number in international style (thousands, millions, billions)
     * Example: 1,000,000
     */
    private static formatInternational(integerStr: string): string {
        // Add commas every 3 digits from right
        const reversed = integerStr.split('').reverse()
        const formatted: string[] = []

        for (let i = 0; i < reversed.length; i++) {
            if (i > 0 && i % 3 === 0) {
                formatted.push(',')
            }
            formatted.push(reversed[i])
        }

        return formatted.reverse().join('')
    }

    /**
     * Format number in Indian style (lakhs, crores)
     * Example: 10,00,000
     */
    private static formatIndian(integerStr: string): string {
        if (integerStr.length <= 3) {
            return integerStr
        }

        const reversed = integerStr.split('').reverse()
        const formatted: string[] = []

        for (let i = 0; i < reversed.length; i++) {
            if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) {
                formatted.push(',')
            }
            formatted.push(reversed[i])
        }

        return formatted.reverse().join('')
    }

    /**
     * Remove formatting from a number string
     */
    static unformat(value: string): string {
        return value.replace(/,/g, '')
    }
}
