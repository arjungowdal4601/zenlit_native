type Level = 'error' | 'warn' | 'info' | 'debug'

const isDev = typeof __DEV__ !== 'undefined' && __DEV__

function write(level: Level, tag: string, message: string, ...args: any[]) {
  const prefix = `[${tag}] ${message}`
  if (level === 'error') console.error(prefix, ...args)
  else if (level === 'warn') console.warn(prefix, ...args)
  else if (isDev) console.log(prefix, ...args)
}

export const logger = {
  setLevel(_level: Level) {
    // kept for compatibility; logging is intentionally env-free now.
  },
  error(tag: string, message: string, ...args: any[]) {
    write('error', tag, message, ...args)
  },
  warn(tag: string, message: string, ...args: any[]) {
    write('warn', tag, message, ...args)
  },
  info(tag: string, message: string, ...args: any[]) {
    write('info', tag, message, ...args)
  },
  debug(tag: string, message: string, ...args: any[]) {
    write('debug', tag, message, ...args)
  },
}

