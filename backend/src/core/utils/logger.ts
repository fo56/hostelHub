enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface Logger {
  error: (message: string) => void
  warn: (message: string) => void
  info: (message: string) => void
  debug: (message: string) => void
}

const formatLog = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level}] ${message}`
}

const logger: Logger = {
  error: (message: string) => {
    console.error(formatLog(LogLevel.ERROR, message))
  },
  warn: (message: string) => {
    console.warn(formatLog(LogLevel.WARN, message))
  },
  info: (message: string) => {
    console.log(formatLog(LogLevel.INFO, message))
  },
  debug: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLog(LogLevel.DEBUG, message))
    }
  },
}

export default logger
export { Logger }
