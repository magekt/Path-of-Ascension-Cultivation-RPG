/**
 * Centralized timestamp utilities for consistent time handling
 */

export class TimestampUtil {
    /**
     * Get current UTC timestamp in ISO format
     */
    static now(): string {
        return new Date().toISOString();
    }

    /**
     * Get current UTC timestamp formatted for display
     */
    static nowFormatted(): string {
        return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    /**
     * Add hours to a timestamp
     */
    static addHours(timestamp: string, hours: number): string {
        const date = new Date(timestamp);
        date.setHours(date.getHours() + hours);
        return date.toISOString();
    }

    /**
     * Calculate hours between two timestamps
     */
    static hoursBetween(start: string, end: string): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    }

    /**
     * Check if a timestamp is expired based on duration
     */
    static isExpired(timestamp: string, durationHours: number): boolean {
        const expiryTime = this.addHours(timestamp, durationHours);
        return new Date() > new Date(expiryTime);
    }

    /**
     * Format timestamp for game display
     */
    static formatForGame(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
}