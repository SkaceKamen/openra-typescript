import { Vector3 } from './utils/math'
import { WDist } from './w-dist'

export class WPos extends Vector3 {
	static fromDists(x: WDist, y: WDist, z: WDist) {
		return new WPos(x.length, y.length, z.length)
	}
}
