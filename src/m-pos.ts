import { Vector2 } from './utils/math'
import { CPos } from './c-pos'

export class MPos extends Vector2 {
	toCPos(gridType: MapGridType | GameMap): CPos {
		if (gridType == MapGridType.Rectangular) {
			return CPos.from(this.x, this.y)
		}

		// Convert from rectangular map position to RectangularIsometric cell position
		//  - The staggered rows make this fiddly (hint: draw a diagram!)
		// (a) Consider the relationships:
		//  - +1u (even -> odd) adds (1, -1) to (x, y)
		//  - +1v (even -> odd) adds (1, 0) to (x, y)
		//  - +1v (odd -> even) adds (0, 1) to (x, y)
		// (b) Therefore:
		//  - au + 2bv adds (a + b) to (x, y)
		//  - a correction factor is added if v is odd
		const offset = (this.y & 1) == 1 ? 1 : 0
		const y = (this.y - offset) / 2 - this.x
		const x = this.y - y
		return CPos.from(x, y)
	}
}

export class PPos extends Vector2 {}
