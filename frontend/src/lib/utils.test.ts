import { describe, it, expect } from 'vitest'
import { formatDate } from './utils'

describe('formatDate', () => {
  it('should return N/A for empty input', () => {
    expect(formatDate('')).toBe('N/A')
  })

  it('should return Invalid Date for malformed string', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date')
  })

  it('should format date string correctly without time', () => {
    // We mock the timezone or just check basic structure to avoid flaky tests,
    // but standard en-US format for a known date is stable.
    const date = new Date('2026-09-20T10:00:00Z')
    const formatted = formatDate(date)
    expect(formatted).toMatch(/Sep \d{1,2}, 2026/)
  })

  it('should include time when requested', () => {
    const date = new Date('2026-09-20T10:00:00Z')
    const formatted = formatDate(date, true)
    expect(formatted).toMatch(/Sep \d{1,2}, 2026, \d{1,2}:\d{2} [AM|PM]+/)
  })
})
