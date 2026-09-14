type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

const getTimestamp = () => new Date().toISOString();

const logMessage = (level: LogLevel, context: string, message: string, data?: any) => {
  const formattedMessage = `[${getTimestamp()}] [${level}] [${context}] ${message}`;
  
  if (data !== undefined) {
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage, data);
        break;
      case 'WARN':
        console.warn(formattedMessage, data);
        break;
      case 'INFO':
        console.info(formattedMessage, data);
        break;
      case 'DEBUG':
        console.debug(formattedMessage, data);
        break;
    }
  } else {
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
    }
  }
};

export const logger = {
  info: (context: string, message: string, data?: any) => logMessage('INFO', context, message, data),
  warn: (context: string, message: string, data?: any) => logMessage('WARN', context, message, data),
  error: (context: string, message: string, data?: any) => logMessage('ERROR', context, message, data),
  debug: (context: string, message: string, data?: any) => logMessage('DEBUG', context, message, data),
};
