/// <reference types="node" />
import { readFileSync } from 'node:fs'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { TaskTrackerDB } from '../db/db'
import { calmLabelColor, hueDistance, hueOf, LABEL_COLOR_NAMES, LABEL_COLORS, LABEL_HUE_GAP, nextColor, RESERVED_HUES } from './colors'

/** The colours that already have a job, read from the tokens themselves so a token change is caught. */
function reservedTokens(): string[] {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
  const values = (name: string) => [...css.matchAll(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'gi'))].map((m) => m[1])
  const out = ['danger', 'primary', 'panel-orange', 'panel-mustard', 'panel-violet', 'panel-sage', 'done-edge'].flatMap(values)
  expect(out.length).toBeGreaterThanOrEqual(9) // both themes' danger and primary, four panels, the done edge
  return out
}

describe('the label palette (#52)', () => {
  it('keeps every colour at least 30° of hue from danger, brand, mustard, violet and done', () => {
    for (const token of reservedTokens()) {
      const reserved = hueOf(token)!.hue
      for (const c of LABEL_COLORS) {
        expect(hueDistance(hueOf(c)!.hue, reserved), `${c} vs ${token}`).toBeGreaterThanOrEqual(LABEL_HUE_GAP)
      }
    }
  })

  it('lists the reserved hues the tokens actually use', () => {
    for (const token of reservedTokens()) {
      const hue = hueOf(token)!.hue
      expect(Math.min(...RESERVED_HUES.map((r) => hueDistance(r, hue))), token).toBeLessThanOrEqual(3)
    }
  })

  it('names every colour', () => {
    expect(LABEL_COLORS.every((c) => LABEL_COLOR_NAMES[c])).toBe(true)
    expect(new Set(LABEL_COLORS).size).toBe(LABEL_COLORS.length)
  })

  it('gives new labels calm colours, in order, then round again', () => {
    expect(nextColor([])).toBe(LABEL_COLORS[0])
    expect(nextColor(LABEL_COLORS.slice(0, 3))).toBe(LABEL_COLORS[3])
    expect(LABEL_COLORS).toContain(nextColor(LABEL_COLORS))
  })
})

describe('calmLabelColor', () => {
  it('moves alarm, brand, mustard and violet hues to the nearest calm one', () => {
    expect(calmLabelColor('#ef4444')).toBe('#8c3274') // red → plum
    expect(calmLabelColor('#10b981')).toBe('#0ea5e9') // emerald, done's hue
    expect(calmLabelColor('#14b8a6')).toBe('#0ea5e9') // teal
    expect(calmLabelColor('#f97316')).toBe('#84cc16') // orange
    expect(calmLabelColor('#f59e0b')).toBe('#84cc16') // amber
    expect(calmLabelColor('#ec4899')).toBe('#8c3274') // pink → plum
    expect(calmLabelColor('#6366f1')).toBe('#3b82f6') // indigo
    expect(calmLabelColor('#8b5cf6')).toBe('#d946ef') // violet
  })

  it('keeps colours that are already calm, greys, and anything it can’t read', () => {
    for (const c of LABEL_COLORS) expect(calmLabelColor(c)).toBe(c)
    expect(calmLabelColor('#2563eb')).toBe('#2563eb') // a custom blue that's fine
    expect(calmLabelColor('#7a7472')).toBe('#7a7472') // a warm grey
    expect(calmLabelColor('rebeccapurple')).toBe('rebeccapurple')
    expect(calmLabelColor(undefined as unknown as string)).toBeUndefined()
  })
})

describe('upgrading an install from before the calm palette', () => {
  it('moves old label colours once, and keeps calm ones', async () => {
    const name = `test-${crypto.randomUUID()}`
    const old = new Dexie(name)
    old.version(1).stores({ tasks: 'id, status, priority, projectId, *tagIds, createdAt, deletedAt', projects: 'id, name', tags: 'id, name', attachments: 'id, taskId' })
    old.version(2).stores({ meta: 'key' })
    old.version(3).stores({})
    await old.table('projects').bulkAdd([
      { id: 'h', name: 'Health', color: '#ef4444' },
      { id: 'home', name: 'Home', color: '#3b82f6' },
    ])
    await old.table('tags').bulkAdd([{ id: 'f', name: 'finance', color: '#f59e0b' }])
    old.close()

    const db = new TaskTrackerDB(name)
    expect((await db.projects.get('h'))?.color).toBe('#8c3274')
    expect((await db.projects.get('home'))?.color).toBe('#3b82f6')
    expect((await db.tags.get('f'))?.color).toBe('#84cc16')
  })
})

describe('retiring orchid', () => {
  it('moves orchid labels to plum, once, on upgrade and in a restored backup', async () => {
    expect(calmLabelColor('#b4469f')).toBe('#8c3274')
    expect(calmLabelColor('#B4469F')).toBe('#8c3274')
    const name = `test-${crypto.randomUUID()}`
    const old = new Dexie(name)
    old.version(1).stores({ tasks: 'id, status, priority, projectId, *tagIds, createdAt, deletedAt', projects: 'id, name', tags: 'id, name', attachments: 'id, taskId' })
    old.version(2).stores({ meta: 'key' })
    old.version(3).stores({})
    old.version(4).stores({})
    await old.table('tags').bulkAdd([
      { id: 'q', name: 'quick', color: '#b4469f' },
      { id: 'r', name: 'reading', color: '#d946ef' },
    ])
    old.close()

    const db = new TaskTrackerDB(name)
    expect((await db.tags.get('q'))?.color).toBe('#8c3274')
    expect((await db.tags.get('r'))?.color).toBe('#d946ef')
  })
})
