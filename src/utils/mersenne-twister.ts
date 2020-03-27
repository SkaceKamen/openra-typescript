//  Quick & dirty Mersenne Twister [MT19937] implementation
export class MersenneTwister {
	mt: number[] = new Array(624)

	index = 0

	last = 0

	totalCount = 0

	constructor(seed: number = performance.now()) {
		this.mt[0] = seed

		for (let i = 1; i < this.mt.length; i++) {
			this.mt[i] = 1812433253 * (this.mt[i - 1] ^ (this.mt[i - 1] >> 30)) + i
		}
	}

	next(low?: number, high?: number): number {
		if (low !== undefined && high !== undefined) {
			if (high < low) {
				throw new Error('Maximum value is less than the minimum value.')
			}

			const diff = high - low
			if (diff <= 1) {
				return low
			}

			return low + (this.next() % diff)
		} else if (high !== undefined) {
			return this.next(0, high)
		} else if (low !== undefined) {
			throw new Error('Low have to be specified with high')
		} else {
			if (this.index == 0) {
				this.generate()
			}

			let y = this.mt[this.index]
			y ^= y >> 11
			y ^= (y << 7) & 2636928640
			y ^= (y << 15) & 4022730752
			y ^= y >> 18

			this.index = (this.index + 1) % 624
			this.totalCount++
			this.last = y % Number.MAX_VALUE
			return this.last
		}
	}

	nextFloat(): number {
		return Math.abs(this.next() / 2147483647)
	}

	generate() {
		for (let i = 0; i < this.mt.length; i++) {
			const y =
				(this.mt[i] & 0x80000000) | (this.mt[(i + 1) % 624] & 0x7fffffff)
			this.mt[i] = this.mt[(i + 397) % 624] ^ (y >> 1)
			if ((y & 1) == 1) {
				this.mt[i] = this.mt[i] ^ 2567483615
			}
		}
	}
}
