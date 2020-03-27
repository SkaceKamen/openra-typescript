import { Vector3 } from './utils/math'
import { WRot } from './w-rot'
import { Int32Matrix4x4 } from './utils/matrix'
import { WAngle } from './w-angle'
import { MersenneTwister } from './utils/mersenne-twister'
import { WDist } from './w-dist'

export class WVec extends Vector3 {
	static zero: WVec = new WVec(0, 0, 0)

	static fromDists(x: WDist, y: WDist, z: WDist) {
		return new WVec(x.length, y.length, z.length)
	}

	get horizontalLengthSquared(): number {
		return this.x * this.x + this.y * this.y
	}

	get horizontalLength(): number {
		return Math.sqrt(this.horizontalLengthSquared)
	}

	get verticalLengthSquared(): number {
		return this.z * this.z
	}

	get verticalLength(): number {
		return Math.sqrt(this.verticalLengthSquared)
	}

	rotate(mtx: WRot | Int32Matrix4x4): WVec {
		if (mtx instanceof WRot) {
			return this.rotate(mtx.asMatrix())
		}

		const lx = this.x
		const ly = this.y
		const lz = this.z
		return new WVec(
			(lx * mtx.M11 + (ly * mtx.M21 + lz * mtx.M31)) / mtx.M44,
			(lx * mtx.M12 + (ly * mtx.M22 + lz * mtx.M32)) / mtx.M44,
			(lx * mtx.M13 + (ly * mtx.M23 + lz * mtx.M33)) / mtx.M44
		)
	}

	get yaw(): WAngle {
		if (this.lengthSquared == 0) {
			return WAngle.zero
		}

		//  OpenRA defines north as -y
		return WAngle.arcTan(this.y * -1, this.x).sub(new WAngle(256))
	}

	static lerp(a: WVec, b: WVec, mul: number, div: number): WVec {
		return a.add(b.sub(a)).mul(mul / div)
	}

	static lerpQuadratic(
		a: WVec,
		b: WVec,
		pitch: WAngle,
		mul: number,
		div: number
	): WVec {
		//  Start with a linear lerp between the points
		const ret = WVec.lerp(a, b, mul, div)
		if (pitch.angle == 0) {
			return ret
		}

		//  Add an additional quadratic variation to height
		//  Uses decimal to avoid integer overflow
		const offset =
			b.sub(a).length *
			(pitch.tan() * (mul * ((div - mul) / (1024 * (div * div)))))
		return new WVec(ret.x, ret.y, ret.z + offset)
	}

	//  Sampled a N-sample probability density function in the range [-1024..1024, -1024..1024]
	//  1 sample produces a rectangular probability
	//  2 samples produces a triangular probability
	//  ...
	//  N samples approximates a true Gaussian
	static fromPDF(r: MersenneTwister, samples: number): WVec {
		return WVec.fromDists(
			WDist.fromPDF(r, samples),
			WDist.fromPDF(r, samples),
			WDist.zero
		)
	}

	getHashCode(): number {
		return this.x ^ this.y ^ this.z
	}
}
