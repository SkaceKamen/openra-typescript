///  <summary>
///  1d world distance - 1024 units = 1 cell.

import { tryParseInt } from './utils/numbers'
import { makeArray } from './utils/collections'
import { MersenneTwister } from './utils/mersenne-twister'

///  </summary>
export class WDist {
	length: number

	get lengthSquared(): number {
		return this.length * this.length
	}

	constructor(r: number) {
		this.length = r
	}

	static zero: WDist = new WDist(0)

	static maxValue: WDist = new WDist(Number.MAX_VALUE)

	static fromCells(cells: number): WDist {
		return new WDist(1024 * cells)
	}

	inv() {
		return new WDist(this.length)
	}

	add(b: WDist) {
		return new WDist(this.length + b.length)
	}

	sub(b: WDist) {
		return new WDist(this.length - b.length)
	}

	div(b: WDist | number) {
		return new WDist(this.length / (typeof b === 'number' ? b : b.length))
	}

	mul(b: WDist | number) {
		return new WDist(this.length / (typeof b === 'number' ? b : b.length))
	}

	lessThan(b: WDist) {
		return this.length < b.length
	}

	moreThan(b: WDist) {
		return this.length > b.length
	}

	lessOrEqualThan(b: WDist) {
		return this.length <= b.length
	}

	moreOrEqualThan(b: WDist) {
		return this.length >= b.length
	}

	equals(b: WDist) {
		return this.length === b.length
	}

	//  Sampled a N-sample probability density function in the range [-1024..1024]
	//  1 sample produces a rectangular probability
	//  2 samples produces a triangular probability
	//  ...
	//  N samples approximates a true Gaussian
	static fromPDF(r: MersenneTwister, samples: number): WDist {
		return new WDist(
			makeArray(samples, () => r.next(-1024, 1024)).reduce(
				(acc, x) => acc + x,
				0
			) / samples
		)
	}

	static tryParse(s: string): WDist | null {
		if (!s || s.length === 0) {
			return null
		}

		s = s.toLowerCase()
		const components = s.split('c')
		let cell = 0
		let subcell = 0
		switch (components.length) {
			case 2:
				try {
					cell = tryParseInt(components[0])
					subcell = tryParseInt(components[1])
				} catch (e) {
					return null
				}

				break
			case 1:
				try {
					subcell = tryParseInt(components[0])
				} catch (e) {
					return null
				}

				break
			default:
				return null
		}

		//  Propagate sign to fractional part
		if (cell < 0) {
			subcell = subcell * -1
		}

		return new WDist(1024 * cell + subcell)
	}

	getHashCode(): number {
		return this.length
	}

	toString(): string {
		const absLength = Math.abs(this.length)
		const absValue =
			(absLength / 1024).toString() + ('c' + (absLength % 1024).toString())
		return this.length < 0 ? `-${absValue}` : absValue
	}
}
