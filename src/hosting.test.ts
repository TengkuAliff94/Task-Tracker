import { describe, expect, it } from 'vitest'
import vercel from '../vercel.json'

// Vercel `source` patterns here use only literal segments and regex groups,
// so an anchored RegExp matches them the way Vercel does.
const matches = (source: string, path: string) => new RegExp(`^${source}$`).test(path)

type Rewrite = { source: string; destination: string }
type Header = { source: string; headers: { key: string; value: string }[] }

const rewrites: Rewrite[] = (vercel as { rewrites?: Rewrite[] }).rewrites ?? []
const headers: Header[] = vercel.headers

const rewriteFor = (path: string) => rewrites.find((r) => matches(r.source, path))?.destination

// Later matching rules override earlier ones, as on Vercel.
const cacheControlFor = (path: string) =>
  headers
    .filter((h) => matches(h.source, path))
    .flatMap((h) => h.headers)
    .filter((h) => h.key.toLowerCase() === 'cache-control')
    .at(-1)?.value

describe('Vercel hosting config', () => {
  it.each(['/', '/today', '/projects/inbox', '/some/deep/path/'])(
    'serves the app shell for page path %s',
    (path) => {
      expect(rewriteFor(path)).toBe('/index.html')
    },
  )

  it.each([
    '/sw.js',
    '/registerSW.js',
    '/manifest.webmanifest',
    '/workbox-1a2b3c4d.js',
    '/assets/index-AbC123.js',
    '/assets/index-AbC123.css',
    '/favicon.ico',
    '/icon.svg',
    '/pwa-192x192.png',
    '/apple-touch-icon-180x180.png',
  ])('does not rewrite real file %s', (path) => {
    expect(rewriteFor(path)).toBeUndefined()
  })

  it.each(['/sw.js', '/registerSW.js', '/manifest.webmanifest', '/', '/index.html', '/today'])(
    'makes browsers revalidate %s on every load',
    (path) => {
      expect(cacheControlFor(path)).toBe('public, max-age=0, must-revalidate')
    },
  )

  it('caches hashed build assets forever', () => {
    expect(cacheControlFor('/assets/index-AbC123.js')).toBe('public, max-age=31536000, immutable')
  })
})
