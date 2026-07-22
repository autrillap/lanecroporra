type LogLevel = 'info' | 'warn' | 'error' | 'audit'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  action: string
  userId?: string
  groupId?: string
  message: string
  metadata?: Record<string, unknown>
}

function writeLog(entry: LogEntry) {
  const line = JSON.stringify(entry)
  switch (entry.level) {
    case 'error':
      console.error('[NECROPORRA]', line)
      break
    case 'warn':
      console.warn('[NECROPORRA]', line)
      break
    default:
      console.log('[NECROPORRA]', line)
  }
}

export function logInfo(action: string, message: string, meta?: { userId?: string; groupId?: string; metadata?: Record<string, unknown> }) {
  writeLog({ timestamp: new Date().toISOString(), level: 'info', action, ...meta, message })
}

export function logWarn(action: string, message: string, meta?: { userId?: string; groupId?: string; metadata?: Record<string, unknown> }) {
  writeLog({ timestamp: new Date().toISOString(), level: 'warn', action, ...meta, message })
}

export function logError(action: string, message: string, meta?: { userId?: string; groupId?: string; metadata?: Record<string, unknown> }) {
  writeLog({ timestamp: new Date().toISOString(), level: 'error', action, ...meta, message })
}

export function logAudit(action: string, message: string, meta?: { userId?: string; groupId?: string; metadata?: Record<string, unknown> }) {
  writeLog({ timestamp: new Date().toISOString(), level: 'audit', action, ...meta, message })
}
