const label = '[content-assets]'

export function log (...data: any[]): void {
  console.info(label, ...data)
}

export function warn (...data: any[]): void {
  console.warn(label, ...data)
}

export function list(message: string, items: string[]) {
  log(`${message}:\n\n${items.map(item => `   - ${item}`).join('\n')}\n`)
}
