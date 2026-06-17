/* eslint-disable no-console */
type LogEnv = Partial<Record<"VITE_WS_DEBUG", string>>

const readDebugFlag = (): boolean => {
  const env = (import.meta as unknown as { env?: LogEnv }).env
  return env?.VITE_WS_DEBUG !== "false"
}

const PREFIX = "%c[ws]"
const STYLE = "color:#0ff;font-weight:bold"

export const wsLog = (scope: string, message: string, data?: unknown): void => {
  if (!readDebugFlag()) return
  if (data === undefined) {
    console.log(`${PREFIX} ${scope} %c${message}`, STYLE, "color:inherit")
  } else {
    console.log(`${PREFIX} ${scope} %c${message}`, STYLE, "color:inherit", data)
  }
}

export const wsWarn = (scope: string, message: string, data?: unknown): void => {
  if (!readDebugFlag()) return
  if (data === undefined) {
    console.warn(`[ws] ${scope} ${message}`)
  } else {
    console.warn(`[ws] ${scope} ${message}`, data)
  }
}

export const redactToken = (token: string): string => {
  if (!token) return "<empty>"
  if (token.length <= 12) return `<len=${String(token.length)}>`
  return `${token.slice(0, 6)}…${token.slice(-4)} (len=${String(token.length)})`
}
