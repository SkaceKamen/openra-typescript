import { Vector2 } from './utils/math'
import { MPos } from './m-pos'

export class CPos {
	//  Coordinates are packed in a 32 bit signed int
	//  X and Y are 12 bits (signed): -2048...2047
	//  Layer is an unsigned byte
	//  Packing is XXXX XXXX XXXX YYYY YYYY YYYY LLLL LLLL
	bits: number

	//  X is padded to MSB, so bit shift does the correct sign extension
	get x(): number {
		return this.bits >> 20
	}

	//  Align Y with a short, cast, then shift the rest of the way
	//  The signed short bit shift does the correct sign extension
	get y(): number {
		return (this.bits >> 4) >> 4
	}

	get layer(): number {
		return this.bits
	}

	static from(x: Vector2): CPos
	static from(x: number, y: number, layer?: number): CPos
	static from(x: number | Vector2, y = 0, layer = 0) {
		if (x instanceof Vector2) {
			return this.from(x.x, x.y)
		}
		return new CPos(((x & 0xfff) << 20) | ((y & 0xfff) << 8) | layer)
	}

	constructor(bits: number) {
		this.bits = bits
	}

	add(b: Vector2) {
		return CPos.from(this.x + b.x, this.y + b.y, this.layer)
	}

	minus(b: Vector2 | CPos) {
		return new Vector2(this.x - b.x, this.y - b.y)
	}

	static Zero: CPos = CPos.from(0, 0, 0)

	toString(): string {
		return this.x + ',' + this.y
	}

	toMPos(gridType: GameMap | MapGridType): MPos {
		if (gridType == MapGridType.rectangular) {
			return new MPos(this.x, this.y)
		}

		//  Convert from RectangularIsometric cell (x, y) position to rectangular map position (u, v)
		//   - The staggered rows make this fiddly (hint: draw a diagram!)
		//  (a) Consider the relationships:
		//   - +1x (even -> odd) adds (0, 1) to (u, v)
		//   - +1x (odd -> even) adds (1, 1) to (u, v)
		//   - +1y (even -> odd) adds (-1, 1) to (u, v)
		//   - +1y (odd -> even) adds (0, 1) to (u, v)
		//  (b) Therefore:
		//   - ax + by adds (a - b)/2 to u (only even increments count)
		//   - ax + by adds a + b to v
		const u = (this.x - this.y) / 2
		const v = this.x + this.y
		return new MPos(u, v)
	}
}
