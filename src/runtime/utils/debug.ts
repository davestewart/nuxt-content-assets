import { moduleKey } from '../config'

export function log (...data: any[]): void {
  console.info(`[${moduleKey}]`, ...data)
}

export function warn (...data: any[]): void {
  console.warn(`[${moduleKey}]`, ...data)
}

export function list(message: string, items: string[]) {
  log(`${message}:\n\n${items.map(item => `   - ${item}`).join('\n')}\n`)
}
