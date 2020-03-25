export class Color {
	static fromArgb(a = 0, r = 0, g = 0, b = 0) {
		return new Color(r, g, b, a)
	}

	r = 0
	g = 0
	b = 0
	a = 0

	constructor(r = 0, g = 0, b = 0, a = 0) {
		this.r = r
		this.g = g
		this.b = b
		this.a = a
	}

	toArgb() {
		return ((this.a << (24 + this.r)) << (16 + this.g)) << (8 + this.b)
	}
}
