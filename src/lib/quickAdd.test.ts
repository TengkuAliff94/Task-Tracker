import { describe, expect, it } from 'vitest'
import { parseQuickAdd, QUICK_ADD_EXAMPLE, QUICK_ADD_SYNTAX } from './quickAdd'

// Sunday 8 Nov 2026, 10:00
const ref = new Date(2026, 10, 8, 10, 0)

describe('the quick-add help', () => {
  it.each(QUICK_ADD_SYNTAX.flatMap((row) => row.tokens.map((token) => [row.name, token, row.field] as const)))(
    '%s: “%s” is read, not left in the title',
    (_name, token, field) => {
      const result = parseQuickAdd(`Water plants ${token}`, ref)
      expect(result.title).toBe('Water plants')
      expect(result[field]).toBeTruthy()
      if (field === 'tagNames') expect(result.tagNames).toHaveLength(1)
    },
  )

  it('reads every part of the example', () => {
    const result = parseQuickAdd(QUICK_ADD_EXAMPLE, ref)
    for (const row of QUICK_ADD_SYNTAX) expect(result[row.field], row.name).toBeTruthy()
    expect(result.title).toBe('Pay rent')
  })
})

describe('parseQuickAdd', () => {
  it('parses the full example', () => {
    expect(parseQuickAdd('Pay rent #finance @home !high ~30m tomorrow 5pm', ref)).toEqual({
      title: 'Pay rent',
      tagNames: ['finance'],
      projectName: 'home',
      priority: 'high',
      effortMinutes: 30,
      deadline: { date: '2026-11-09', time: '17:00' },
    })
  })

  it('leaves plain text alone', () => {
    expect(parseQuickAdd('Buy milk', ref)).toEqual({ title: 'Buy milk', tagNames: [] })
  })

  it('collects several tags and ignores duplicates', () => {
    expect(parseQuickAdd('Read #book #Learning #book', ref).tagNames).toEqual(['book', 'Learning'])
  })

  it('accepts priority aliases', () => {
    expect(parseQuickAdd('x !med', ref).priority).toBe('medium')
    expect(parseQuickAdd('x !URGENT', ref).priority).toBe('urgent')
  })

  it('keeps unknown ! and ~ tokens in the title', () => {
    const r = parseQuickAdd('Wow !amazing ~soon', ref)
    expect(r.title).toBe('Wow !amazing ~soon')
    expect(r.priority).toBeUndefined()
    expect(r.effortMinutes).toBeUndefined()
  })

  it('does not treat an email address as a project', () => {
    const r = parseQuickAdd('Email ali@example.com', ref)
    expect(r.title).toBe('Email ali@example.com')
    expect(r.projectName).toBeUndefined()
  })

  it('reads a date without a time as date-only', () => {
    expect(parseQuickAdd('Dentist next friday', ref)).toMatchObject({
      title: 'Dentist',
      deadline: { date: '2026-11-13', time: undefined },
    })
  })

  it('reads numeric dates day-first', () => {
    expect(parseQuickAdd('Renew passport 05/12', ref).deadline).toEqual({ date: '2026-12-05', time: undefined })
  })

  it('drops a dangling connector word', () => {
    expect(parseQuickAdd('Submit report by friday', ref).title).toBe('Submit report')
  })

  it('parses hour+minute effort', () => {
    expect(parseQuickAdd('Workout ~1h30m', ref).effortMinutes).toBe(90)
  })
})
