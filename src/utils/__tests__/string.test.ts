import { endsWith } from '../string'

describe('endsWith', () => {
	it('should properly indefity ending in case insensitive', () => {
		expect(endsWith('test', 'st', false)).toBe(true)
		expect(endsWith('tesT', 'sT', false)).toBe(true)
		expect(endsWith('test', 'sT', false)).toBe(false)
		expect(endsWith('test', 'es', false)).toBe(false)
	})

	it('should properly indefity ending in case sensitive way', () => {
		expect(endsWith('test', 'st')).toBe(true)
		expect(endsWith('tesT', 'sT')).toBe(true)
		expect(endsWith('test', 'sT')).toBe(true)
		expect(endsWith('test', 'es')).toBe(false)
	})
})
