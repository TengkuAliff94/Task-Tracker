import { expect, it } from 'vitest'
import { formatEffort, parseEffort } from './effort'

it.each([
  ['30m', 30],
  ['2h', 120],
  ['1h30m', 90],
  ['1h 30m', 90],
  ['1.5h', 90],
  ['45', 45],
  ['', undefined],
  ['abc', undefined],
  ['0m', undefined],
])('parseEffort(%j) = %j', (input, expected) => {
  expect(parseEffort(input)).toBe(expected)
})

it.each([
  [30, '30m'],
  [120, '2h'],
  [90, '1h 30m'],
])('formatEffort(%i) = %s', (input, expected) => {
  expect(formatEffort(input)).toBe(expected)
})
