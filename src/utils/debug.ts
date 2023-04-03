import { name } from '../config'

export function log (...data: any[]) {
  console.info(`[${name}]`, ...data)
}

export function warn (...data: any[]) {
  console.warn(`[${name}]`, ...data)
}
