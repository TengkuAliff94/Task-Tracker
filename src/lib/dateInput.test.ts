import { describe, expect, it } from 'vitest'
import { formatDateText, instantOf, readDateText, readTimeText } from './dateInput'

// Tuesday 10/03/2026, 09:00.
const now = new Date(2026, 2, 10, 9, 0)
const date = (text: string) => readDateText(text, now)

describe('readDateText', () => {
  it('reads nothing from empty text', () => {
    expect(date('')).toBeUndefined()
    expect(date('   ')).toBeUndefined()
  })

  it('reads the day first, whatever the separator', () => {
    for (const text of ['08/03/2026', '8/3/2026', '8.3.2026', '8-3-2026', '08032026', ' 8/3/26 ', '8 march 2026']) {
      expect(date(text), text).toEqual({ ok: true, date: '2026-03-08' })
    }
  })

  it('takes an ISO date pasted from elsewhere', () => {
    expect(date('2026-03-08')).toEqual({ ok: true, date: '2026-03-08' })
  })

  it('without a year, picks the next time that day comes round, today included', () => {
    expect(date('10/3')).toEqual({ ok: true, date: '2026-03-10' })
    expect(date('25/4')).toEqual({ ok: true, date: '2026-04-25' })
    expect(date('8/3')).toEqual({ ok: true, date: '2027-03-08' })
    expect(date('29/2')).toEqual({ ok: true, date: '2028-02-29' })
  })

  it('refuses a date that does not exist, naming it', () => {
    expect(date('31/02/2026')).toEqual({ ok: false, error: '“31/02/2026” isn’t a date. Check the day and month.' })
    expect(date('3/13/2026')).toMatchObject({ ok: false })
    expect(date('29/02/2027')).toMatchObject({ ok: false })
    expect(date('0/3')).toMatchObject({ ok: false })
  })

  it('reads words the way quick add does, forward from today', () => {
    expect(date('today')).toEqual({ ok: true, date: '2026-03-10', time: undefined })
    expect(date('Tomorrow')).toEqual({ ok: true, date: '2026-03-11', time: undefined })
    expect(date('fri')).toEqual({ ok: true, date: '2026-03-13', time: undefined })
    expect(date('8 march')).toEqual({ ok: true, date: '2027-03-08', time: undefined })
    expect(date('in 3 days')).toEqual({ ok: true, date: '2026-03-13', time: undefined })
  })

  it('keeps a time given with the date, so it is not dropped', () => {
    expect(date('fri 5pm')).toEqual({ ok: true, date: '2026-03-13', time: '17:00' })
    expect(date('fri 0900')).toEqual({ ok: true, date: '2026-03-13', time: '09:00' })
    expect(date('tomorrow 9')).toEqual({ ok: true, date: '2026-03-11', time: '09:00' })
    expect(date('8/3/2026 1730')).toEqual({ ok: true, date: '2026-03-08', time: '17:30' })
  })

  it('reads a 24-hour time after the date as a time, never as the year', () => {
    expect(date('8/3 1730')).toEqual({ ok: true, date: '2027-03-08', time: '17:30' })
    expect(date('8/3 17')).toEqual({ ok: true, date: '2027-03-08', time: '17:00' })
    expect(date('8/3 0930')).toEqual({ ok: true, date: '2027-03-08', time: '09:30' })
    expect(date('8 march 1730')).toEqual({ ok: true, date: '2027-03-08', time: '17:30' })
  })

  it('refuses a year it could not store, rather than saving a broken date', () => {
    expect(date('08/03/0930')).toMatchObject({ ok: false })
    expect(date('08/03/0050')).toMatchObject({ ok: false })
  })

  it('refuses text that is only partly a date', () => {
    expect(date('mon plans')).toEqual({ ok: false, error: 'Use DD/MM/YYYY, such as 08/03/2026, or clear it.' })
    expect(date('8 3 2026')).toMatchObject({ ok: false })
    expect(date('soon')).toMatchObject({ ok: false })
    expect(date('5')).toMatchObject({ ok: false })
    expect(date('8/3/202')).toMatchObject({ ok: false })
  })
})

describe('readTimeText', () => {
  it('reads nothing from empty text', () => {
    expect(readTimeText('')).toBeUndefined()
  })

  it('reads the 24-hour clock in its usual spellings', () => {
    for (const text of ['17:30', '17.30', '17h30', '1730', ' 17:30 ']) expect(readTimeText(text), text).toEqual({ ok: true, time: '17:30' })
    expect(readTimeText('930')).toEqual({ ok: true, time: '09:30' })
    expect(readTimeText('9')).toEqual({ ok: true, time: '09:00' })
    expect(readTimeText('0:05')).toEqual({ ok: true, time: '00:05' })
  })

  it('turns am and pm into the 24-hour clock', () => {
    expect(readTimeText('5pm')).toEqual({ ok: true, time: '17:00' })
    expect(readTimeText('5:30 PM')).toEqual({ ok: true, time: '17:30' })
    expect(readTimeText('1230pm')).toEqual({ ok: true, time: '12:30' })
    expect(readTimeText('530pm')).toEqual({ ok: true, time: '17:30' })
    expect(readTimeText('12am')).toEqual({ ok: true, time: '00:00' })
    expect(readTimeText('12pm')).toEqual({ ok: true, time: '12:00' })
    expect(readTimeText('9 a.m.')).toEqual({ ok: true, time: '09:00' })
    expect(readTimeText('noon')).toEqual({ ok: true, time: '12:00' })
    expect(readTimeText('midnight')).toEqual({ ok: true, time: '00:00' })
  })

  it('refuses a time that does not exist, saying why', () => {
    expect(readTimeText('25:00')).toEqual({ ok: false, error: '“25:00” isn’t a time. Hours go up to 23 and minutes up to 59.' })
    expect(readTimeText('17:60')).toMatchObject({ ok: false })
    expect(readTimeText('13pm')).toEqual({ ok: false, error: '“13pm” isn’t a time. With am or pm, hours go from 1 to 12.' })
  })

  it('refuses text that is not a time', () => {
    expect(readTimeText('5:')).toEqual({ ok: false, error: 'Use the 24-hour clock, such as 17:30, or clear it.' })
    expect(readTimeText('later')).toMatchObject({ ok: false })
    expect(readTimeText('17:3')).toMatchObject({ ok: false })
  })
})

describe('formatDateText and instantOf', () => {
  it('writes an ISO date day first', () => {
    expect(formatDateText('2026-03-08')).toBe('08/03/2026')
  })

  it('names the local moment of a date and time', () => {
    expect(instantOf('2026-03-12', '19:05')).toBe(new Date(2026, 2, 12, 19, 5).getTime())
  })
})
