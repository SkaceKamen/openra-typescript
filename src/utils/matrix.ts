export class Int32Matrix4x4 {
	M11: number
	M12: number
	M13: number
	M14: number
	M21: number
	M22: number
	M23: number
	M24: number
	M31: number
	M32: number
	M33: number
	M34: number
	M41: number
	M42: number
	M43: number
	M44: number

	constructor(
		m11: number,
		m12: number,
		m13: number,
		m14: number,
		m21: number,
		m22: number,
		m23: number,
		m24: number,
		m31: number,
		m32: number,
		m33: number,
		m34: number,
		m41: number,
		m42: number,
		m43: number,
		m44: number
	) {
		this.M11 = m11
		this.M12 = m12
		this.M13 = m13
		this.M14 = m14
		this.M21 = m21
		this.M22 = m22
		this.M23 = m23
		this.M24 = m24
		this.M31 = m31
		this.M32 = m32
		this.M33 = m33
		this.M34 = m34
		this.M41 = m41
		this.M42 = m42
		this.M43 = m43
		this.M44 = m44
	}

	static equals(me: Int32Matrix4x4, other: Int32Matrix4x4): boolean {
		return (
			me.M11 == other.M11 &&
			me.M12 == other.M12 &&
			me.M13 == other.M13 &&
			me.M14 == other.M14 &&
			me.M21 == other.M21 &&
			me.M22 == other.M22 &&
			me.M23 == other.M23 &&
			me.M24 == other.M24 &&
			me.M31 == other.M31 &&
			me.M32 == other.M32 &&
			me.M33 == other.M33 &&
			me.M34 == other.M34 &&
			me.M41 == other.M41 &&
			me.M42 == other.M42 &&
			me.M43 == other.M43 &&
			me.M44 == other.M44
		)
	}

	static notEquals(me: Int32Matrix4x4, other: Int32Matrix4x4): boolean {
		return !(me == other)
	}

	getHashCode(): number {
		return this.M11 | (this.M22 | (this.M33 | this.M44))
	}

	equals(other: Int32Matrix4x4): boolean {
		return Int32Matrix4x4.equals(this, other)
	}

	toString(): string {
		return `[${this.M11} ${this.M12} ${this.M13} ${this.M14}],[${this.M21} ${this.M22} ${this.M23} ${this.M24}],[${this.M31} ${this.M32} ${this.M33} ${this.M34}],[${this.M41} ${this.M42} ${this.M43} ${this.M44}]`
	}
}
