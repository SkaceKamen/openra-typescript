import { WAngle } from './w-angle'
import { Quaternion } from './utils/math'
import { Int32Matrix4x4 } from './utils/matrix'

export class WRot {
	roll: WAngle
	pitch: WAngle
	yaw: WAngle

	constructor(roll: WAngle, pitch: WAngle, yaw: WAngle) {
		this.roll = roll
		this.pitch = pitch
		this.yaw = yaw
	}

	static zero: WRot = new WRot(WAngle.zero, WAngle.zero, WAngle.zero)

	static fromFacing(facing: number): WRot {
		return new WRot(WAngle.zero, WAngle.zero, WAngle.fromFacing(facing))
	}

	static fromYaw(yaw: WAngle): WRot {
		return new WRot(WAngle.zero, WAngle.zero, yaw)
	}

	add(b: WRot) {
		return new WRot(
			this.roll.add(b.roll),
			this.pitch.add(b.pitch),
			this.yaw.add(b.yaw)
		)
	}

	sub(b: WRot) {
		return new WRot(
			this.roll.sub(b.roll),
			this.pitch.sub(b.pitch),
			this.yaw.sub(b.yaw)
		)
	}

	inv() {
		return new WRot(this.roll.inv(), this.pitch.inv(), this.yaw.inv())
	}

	equals(b: WRot) {
		return (
			this.roll.equals(b.roll) &&
			this.pitch.equals(b.pitch) &&
			this.yaw.equals(b.yaw)
		)
	}
	withYaw(yaw: WAngle): WRot {
		return new WRot(this.roll, this.pitch, yaw)
	}

	asQuaternion(): Quaternion {
		//  Angles increase clockwise
		const roll = new WAngle((this.roll.angle / 2) * -1)
		const pitch = new WAngle((this.pitch.angle / 2) * -1)
		const yaw = new WAngle((this.yaw.angle / 2) * -1)
		const cr = roll.cos()
		const sr = roll.sin()
		const cp = pitch.cos()
		const sp = pitch.sin()
		const cy = yaw.cos()
		const sy = yaw.sin()
		//  Normalized to 1024 == 1.0
		return new Quaternion(
			(sr * (cp * cy) - cr * (sp * sy)) / 1048576,
			(cr * (sp * cy) + sr * (cp * sy)) / 1048576,
			(cr * (cp * sy) - sr * (sp * cy)) / 1048576,
			(cr * (cp * cy) + sr * (sp * sy)) / 1048576
		)
	}

	asMatrix(): Int32Matrix4x4 {
		const { x, y, z, w } = this.asQuaternion()
		//  Theoretically 1024 *  * 2, but may differ slightly due to rounding
		const lsq = x * x + y * y + z * z + w * w
		//  Quaternion components use 10 bits, so there's no risk of overflow
		return new Int32Matrix4x4(
			lsq - 2 * (y * y + z * z),
			2 * (x * y + z * w),
			2 * (x * z - y * w),
			0,
			2 * (x * y - z * w),
			lsq - 2 * (x * x + z * z),
			2 * (y * z + x * w),
			0,
			2 * (x * z + y * w),
			2 * (y * z - x * w),
			lsq - 2 * (x * x + y * y),
			0,
			0,
			0,
			0,
			lsq
		)
	}

	getHashCode(): number {
		return (
			this.roll.getHashCode() ^
			this.pitch.getHashCode() ^
			this.yaw.getHashCode()
		)
	}

	toString(): string {
		return (
			this.roll.toString() +
			(',' + (this.pitch.toString() + (',' + this.yaw.toString())))
		)
	}
}
