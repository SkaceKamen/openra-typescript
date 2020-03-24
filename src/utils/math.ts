export const isPowerOf2 = (x: number) => Math.log2(x) % 1 === 0

export class Rectangle {
	left: number
	right: number
	top: number
	bottom: number

	constructor(left: number, right: number, top: number, bottom: number) {
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
}

export class Vector2 {
	x: number
	y: number

	constructor(x = 0, y = 0) {
		this.x = x
		this.y = y
	}
}

export class Vector3 {
	x: number
	y: number
	z: number

	constructor(x = 0, y = 0, z = 0) {
		this.x = x
		this.y = y
		this.z = z
	}
}
