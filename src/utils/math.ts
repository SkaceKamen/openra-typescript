/* eslint-disable @typescript-eslint/no-explicit-any */
export const isPowerOf2 = (x: number) => Math.log2(x) % 1 === 0

export const nextPowerOf2 = (v: number) => {
	--v
	v |= v >> 1
	v |= v >> 2
	v |= v >> 4
	v |= v >> 8
	++v

	return v
}

export class Rectangle {
	static empty = new Rectangle(0, 0, 0, 0)

	static fromLTRB(left: number, top: number, right: number, bottom: number) {
		return new Rectangle(left, top, right, bottom)
	}

	static fromPosSize(pos: Vector2, size: Size) {
		return new Rectangle(pos.x, pos.y, pos.x + size.width, pos.y + size.height)
	}

	static intersect(a: Rectangle, b: Rectangle) {
		if (!a.intersectsWithInclusive(b)) {
			return Rectangle.empty
		}

		return Rectangle.fromLTRB(
			Math.max(a.left, b.left),
			Math.max(a.top, b.top),
			Math.min(a.right, b.right),
			Math.min(a.bottom, b.bottom)
		)
	}

	left: number
	right: number
	top: number
	bottom: number

	constructor(left: number, top: number, right: number, bottom: number) {
		this.top = top
		this.bottom = bottom
		this.left = left
		this.right = right
	}

	get width() {
		return this.right - this.left
	}

	get height() {
		return this.bottom - this.top
	}

	get size() {
		return new Size(this.width, this.height)
	}

	get location() {
		return new Vector2(this.left, this.top)
	}

	intersectsWith(rect: Rectangle) {
		return (
			this.left < rect.right &&
			this.right > rect.left &&
			this.top < rect.bottom &&
			this.bottom > rect.top
		)
	}

	intersectsWithInclusive(r: Rectangle) {
		return (
			this.left <= r.right &&
			this.right >= r.left &&
			this.top <= r.bottom &&
			this.bottom >= r.top
		)
	}

	contains(rect: Rectangle) {
		return rect == Rectangle.intersect(this, rect)
	}
}

export class Vector2 {
	static zero = new Vector2()

	static fromSize(s: Size) {
		return new Vector2(s.width, s.height)
	}

	x: number
	y: number

	constructor(x = 0, y = 0) {
		this.x = x
		this.y = y
	}

	add(v: Vector2) {
		return new Vector2(this.x + v.x, this.y + v.y)
	}

	sub(v: Vector3) {
		return new Vector2(this.x - v.x, this.y - v.y)
	}

	mul(m: number) {
		return new Vector2(this.x * m, this.y * m)
	}

	clamp(r: Rectangle) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return new (this as any).constructor(
			Math.min(r.right, Math.max(this.x, r.left)),
			Math.min(r.bottom, Math.max(this.y, r.top))
		)
	}
}

export class Vector3 {
	static zero = new Vector3()

	static from(v: Vector2) {
		return new Vector3(v.x, v.y, 0)
	}

	x: number
	y: number
	z: number

	constructor(x = 0, y = 0, z = 0) {
		this.x = x
		this.y = y
		this.z = z
	}

	add(b: Vector3): this {
		return new (this.constructor as any)(
			this.x + b.x,
			this.y + b.y,
			this.z + b.z
		)
	}

	sub(b: Vector3): this {
		return new (this.constructor as any)(
			this.x - b.x,
			this.y - b.y,
			this.z - b.z
		)
	}

	inv(): this {
		return new (this.constructor as any)(-this.x, -this.y, -this.z)
	}

	mul(b: number | Vector3): this {
		if (b instanceof Vector3) {
			return new (this.constructor as any)(
				this.x * b.x,
				this.y * b.y,
				this.z * b.z
			)
		}
		return new (this.constructor as any)(this.x * b, this.y * b, this.z * b)
	}

	div(b: number | Vector3): this {
		if (b instanceof Vector3) {
			return new (this.constructor as any)(
				this.x / b.x,
				this.y / b.y,
				this.z / b.z
			)
		}
		return new (this.constructor as any)(this.x / b, this.y / b, this.z / b)
	}

	get lengthSquared(): number {
		return this.x * this.x + this.y * this.y + this.z * this.z
	}

	get length(): number {
		return Math.sqrt(this.lengthSquared)
	}
}

export class Size {
	width: number
	height: number

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
	}

	nextPowerOf2() {
		return new Size(nextPowerOf2(this.width), nextPowerOf2(this.height))
	}
}

export class Quaternion {
	x: number
	y: number
	z: number
	w: number

	constructor(x: number, y: number, z: number, w: number) {
		this.x = x
		this.y = y
		this.z = z
		this.w = w
	}
}
