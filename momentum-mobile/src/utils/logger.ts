const LOG_PREFIX = '[Momentum]';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const shouldLog = (level: LogLevel): boolean => {
  if (__DEV__) return true;
  return level === 'warn' || level === 'error';
};

export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog('debug')) console.log(LOG_PREFIX, ...args);
  },
  info: (...args: any[]) => {
    if (shouldLog('info')) console.log(LOG_PREFIX, ...args);
  },
  warn: (...args: any[]) => {
    if (shouldLog('warn')) console.warn(LOG_PREFIX, ...args);
  },
  error: (...args: any[]) => {
    if (shouldLog('error')) console.error(LOG_PREFIX, ...args);
  },
};
