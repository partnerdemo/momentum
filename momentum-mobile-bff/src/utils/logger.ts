// src/utils/logger.ts
// Simple structured logger to replace console.log

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
}

class Logger {
    private formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...(context && { context }),
        };
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        const entry = this.formatLog(level, message, context);

        // In development, use pretty formatting
        if (process.env.NODE_ENV === 'development') {
            const prefix = `[${entry.timestamp}] [${entry.level}]`;
            console.log(`${prefix} ${entry.message}`, context ? context : '');
        } else {
            // In production, use JSON for log aggregation tools
            console.log(JSON.stringify(entry));
        }
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.INFO, message, context);
    }

    warn(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.WARN, message, context);
    }

    error(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.ERROR, message, context);
    }
}

export const logger = new Logger();
export default logger;
