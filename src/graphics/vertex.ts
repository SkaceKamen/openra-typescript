export class Vertex {
	x: number
	y: number
	z: number
	s: number
	t: number
	u: number
	v: number
	p: number
	c: number

	constructor(x = 0, y = 0, z = 0, s = 0, t = 0, u = 0, v = 0, p = 0, c = 0) {
		this.x = x
		this.y = y
		this.z = z
		this.s = s
		this.t = t
		this.u = u
		this.v = v
		this.p = p
		this.c = c
	}
}
