import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { imageSize } from 'image-size'
import WebSocket from 'ws'
import { expect } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'

type SetupOptions = Parameters<typeof setup>[0]

/**
 * Get the absolute path to a fixture
 */
export function getFixturePath (name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

/**
 * Build and serve a fixture from a fresh, fixed build folder
 *
 * Nuxt Test Utils only removes its (random) build folder if it didn't exist after loading Nuxt,
 * but this module writes to it during `modules:done`, so we manage the folder ourselves
 */
export async function setupFixture (name: string, options: SetupOptions = {}) {
  const rootDir = getFixturePath(name)
  const buildDir = `${rootDir}/.nuxt/test`
  rmSync(buildDir, { recursive: true, force: true })
  // nuxt content's database, which also caches parsed documents
  rmSync(`${rootDir}/.data`, { recursive: true, force: true })
  await setup({ rootDir, buildDir, ...options })
  return {
    rootDir,
    buildDir,
    outputDir: `${buildDir}/output`,
  }
}

/**
 * Generate a fixture, equivalent to `nuxi generate`, prerendering the given routes
 */
export function generateFixture (name: string, routes: string[]) {
  return setupFixture(name, {
    server: false,
    nuxtConfig: {
      _generate: true,
      nitro: {
        static: true,
        prerender: { routes, crawlLinks: false },
      },
    } as NonNullable<SetupOptions>['nuxtConfig'],
  })
}

/**
 * Run `nuxi dev` for a fixture
 *
 * Nuxt Test Utils' dev mode also loads Nuxt in the test process, which would run a second copy of
 * the module against the shared cache folder, so we run the dev server directly instead
 */
export async function startDevServer (name: string) {
  const rootDir = getFixturePath(name)
  const port = await getPort()
  const url = `http://127.0.0.1:${port}`

  // start clean, as Nuxt Content's parse cache would otherwise survive from previous runs
  rmSync(`${rootDir}/.nuxt`, { recursive: true, force: true })
  rmSync(`${rootDir}/.data`, { recursive: true, force: true })

  const nuxi = fileURLToPath(new URL('../../node_modules/.bin/nuxi', import.meta.url))
  const { NODE_ENV: _, ...env } = process.env
  const server = spawn(process.execPath, [nuxi, 'dev', rootDir, '--port', String(port), '--host', '127.0.0.1'], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  })

  // keep the output, to report if the server fails to start
  let output = ''
  const onData = (data: Buffer) => {
    output = (output + data).slice(-5_000)
  }
  server.stdout.on('data', onData)
  server.stderr.on('data', onData)

  // stop the server and any processes it forked, waiting for them to exit, as they write to the cache on close
  const close = async () => {
    const pid = server.pid
    if (!pid) {
      return
    }
    const isRunning = () => {
      try {
        process.kill(-pid, 0)
        return true
      }
      catch {
        return false
      }
    }
    if (isRunning()) {
      process.kill(-pid, 'SIGTERM')
      await waitFor(() => !isRunning(), 10_000).catch(() => process.kill(-pid, 'SIGKILL'))
    }
  }

  // wait for the app to be ready
  try {
    const html = await waitFor(async () => {
      // requests can stall while the server starts, so time them out and retry
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) })
      const html = await res.text()
      return res.ok && !html.includes('__NUXT_LOADING__') && html
    }, 120_000, 500)
    return {
      url,
      html,
      close,
      get: (path: string) => fetch(url + path, { signal: AbortSignal.timeout(10_000) }),
    }
  }
  catch (error) {
    await close()
    throw new Error(`Dev server failed to start: ${error}\n\n${output}`, { cause: error })
  }
}

/**
 * Connect to a dev server's Vite HMR channel, and collect the data of custom events with the given name
 */
export async function connectHmr (url: string, event: string) {
  // the client script includes the token vite needs to accept the connection
  const client = await (await fetch(`${url}/_nuxt/@vite/client`)).text()
  const token = client.match(/const wsToken = "([^"]+)"/)?.[1]
  expect(token).toBeDefined()

  const messages: any[] = []
  const socket = new WebSocket(`${url.replace(/^http/, 'ws')}/_nuxt/?token=${token}`, 'vite-hmr')
  socket.on('message', (data) => {
    const message = JSON.parse(String(data))
    if (message.type === 'custom' && message.event === event) {
      messages.push(message.data)
    }
  })
  await new Promise((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })
  return {
    messages,
    close: () => socket.close(),
  }
}

/**
 * Get a free port
 */
export function getPort (): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    })
  })
}

/**
 * Poll a function until it returns a truthy value
 */
export async function waitFor<T> (fn: () => T | Promise<T>, timeout = 10_000, interval = 100): Promise<Exclude<T, false | null | undefined>> {
  const end = Date.now() + timeout
  let lastError: unknown
  while (Date.now() < end) {
    try {
      const result = await fn()
      if (result) {
        return result as Exclude<T, false | null | undefined>
      }
    }
    catch (error) {
      lastError = error
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  throw lastError || new Error(`Timed out after ${timeout}ms`)
}

/**
 * Collect the props of every element with the given tag, in a minimark body or node
 *
 * Nuxt Content stores bodies as minimark: `{ type: 'minimark', value: [[tag, props, ...children], ...] }`
 */
export function findProps (node: any, tag: string, found: Record<string, any>[] = []): Record<string, any>[] {
  if (node?.type === 'minimark') {
    node = ['root', {}, ...node.value]
  }
  if (Array.isArray(node)) {
    const [name, props, ...children] = node
    if (name === tag) {
      found.push(props)
    }
    for (const child of children) {
      findProps(child, tag, found)
    }
  }
  return found
}

/**
 * Get the props of the element with the given tag and alt text
 */
export function findImage (body: any, alt: string): Record<string, any> | undefined {
  return findProps(body, 'img').find(props => props.alt === alt)
}

/**
 * Get the dimensions of a served image
 */
export async function getSize (res: Response) {
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toContain('image/')
  return imageSize(new Uint8Array(await res.arrayBuffer()))
}
