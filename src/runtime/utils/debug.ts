import { moduleKey } from '../../config'

export function log (...data: any[]) {
  console.info(`[${moduleKey}]`, ...data)
}

export function warn (...data: any[]) {
  console.warn(`[${moduleKey}]`, ...data)
}
