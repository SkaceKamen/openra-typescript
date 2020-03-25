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
	static Empty = new Rectangle(0, 0, 0, 0)

	static fromLTRB(left: number, top: number, right: number, bottom: number) {
		return new Rectangle(left, top, right, bottom)
	}

	static fromPosSize(pos: Vector2, size: Size) {
		return new Rectangle(pos.x, pos.y, pos.x + size.width, pos.y + size.height)
	}

	static intersect(a: Rectangle, b: Rectangle) {
		if (!a.intersectsWithInclusive(b)) {
			return Rectangle.Empty
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
}

export class Vector3 {
	static zero = new Vector3()

	x: number
	y: number
	z: number

	constructor(x = 0, y = 0, z = 0) {
		this.x = x
		this.y = y
		this.z = z
	}

	div(b: Vector3) {
		return new Vector3(this.x / b.x, this.y / b.y, this.z / b.z)
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
