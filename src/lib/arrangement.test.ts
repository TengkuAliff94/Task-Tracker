import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ARRANGEMENT, loadArrangement, parseArrangement, saveArrangement } from './arrangement'

describe('parseArrangement', () => {
  it('reads back a stored arrangement', () => {
    expect(parseArrangement('{"sort":"deadline","group":"project","showCompleted":true}')).toEqual({
      sort: 'deadline',
      group: 'project',
      showCompleted: true,
    })
  })

  it('falls back to the default for nothing stored, broken JSON or a non-object', () => {
    for (const raw of [null, '', '{', '"deadline"', '42', 'null', '[]']) expect(parseArrangement(raw)).toEqual(DEFAULT_ARRANGEMENT)
  })

  it('keeps each known part and drops only what it does not know', () => {
    expect(parseArrangement('{"sort":"shuffle","group":"priority","showCompleted":"yes"}')).toEqual({
      sort: 'smart',
      group: 'priority',
      showCompleted: false,
    })
    // Inherited names aren't sort keys.
    expect(parseArrangement('{"sort":"toString","group":"constructor"}')).toEqual(DEFAULT_ARRANGEMENT)
  })
})

describe('load and save', () => {
  afterEach(() => vi.unstubAllGlobals())

  function fakeStorage() {
    const data = new Map<string, string>()
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    }
  }

  it('round-trips, and stores the default as nothing', () => {
    const s = fakeStorage()
    vi.stubGlobal('localStorage', s)
    saveArrangement({ sort: 'title', group: 'status', showCompleted: true })
    expect(loadArrangement()).toEqual({ sort: 'title', group: 'status', showCompleted: true })
    saveArrangement(DEFAULT_ARRANGEMENT)
    expect(s.data.size).toBe(0)
    expect(loadArrangement()).toEqual(DEFAULT_ARRANGEMENT)
  })

  it('blocked storage neither throws nor loses the defaults', () => {
    const boom = () => {
      throw new DOMException('blocked', 'SecurityError')
    }
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom })
    expect(loadArrangement()).toEqual(DEFAULT_ARRANGEMENT)
    expect(() => saveArrangement({ sort: 'title', group: 'none', showCompleted: false })).not.toThrow()
  })
})
