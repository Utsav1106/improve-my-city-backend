import { createLogger, format, transports, Logger } from 'winston'
import 'winston-daily-rotate-file'
import path from 'path'

const { combine, timestamp, printf, colorize, errors } = format

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    let formattedMessage = message
    
    const metaValues = Object.values(meta).filter(value => value !== undefined)
    if (metaValues.length > 0) {
        const allArgs = [message, ...metaValues].map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2)
            }
            return String(arg)
        })
        formattedMessage = allArgs.join(' ')
    }
    
    return stack
        ? `${timestamp} [${level}]: ${stack}`
        : `${timestamp} [${level}]: ${formattedMessage}`
})

const dailyRotateTransport = new transports.DailyRotateFile({
    filename: path.join('logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
})

const logger: Logger = createLogger({
    level: 'info',
    format: combine(
        colorize(),
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.Console({
            handleExceptions: true
        }),
        dailyRotateTransport,
        new transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            handleRejections: true
        }),
    ],
    exitOnError: false
})

const originalError = logger.error.bind(logger)
const originalWarn = logger.warn.bind(logger)
const originalInfo = logger.info.bind(logger)
const originalDebug = logger.debug.bind(logger)

logger.error = (...args: any[]) => {
    if (args.length === 1) {
        return originalError(args[0])
    }
    return originalError(args[0], ...args.slice(1))
}

logger.warn = (...args: any[]) => {
    if (args.length === 1) {
        return originalWarn(args[0])
    }
    return originalWarn(args[0], ...args.slice(1))
}

logger.info = (...args: any[]) => {
    if (args.length === 1) {
        return originalInfo(args[0])
    }
    return originalInfo(args[0], ...args.slice(1))
}

logger.debug = (...args: any[]) => {
    if (args.length === 1) {
        return originalDebug(args[0])
    }
    return originalDebug(args[0], ...args.slice(1))
}

export default logger