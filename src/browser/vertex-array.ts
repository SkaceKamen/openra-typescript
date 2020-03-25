import { Vertex } from '../graphics/vertex'
import { Vector3 } from '../utils/math'

export class VertexArray {
	buffer: Float32Array

	private size: number

	constructor(size: number) {
		this.size = size
		this.buffer = new Float32Array(size * 9)
	}

	set(index: number, vertex: Vertex) {
		this.buffer[index * 9 + 0] = vertex.x
		this.buffer[index * 9 + 1] = vertex.y
		this.buffer[index * 9 + 2] = vertex.z
		this.buffer[index * 9 + 3] = vertex.s
		this.buffer[index * 9 + 4] = vertex.t
		this.buffer[index * 9 + 5] = vertex.u
		this.buffer[index * 9 + 6] = vertex.v
		this.buffer[index * 9 + 7] = vertex.p
		this.buffer[index * 9 + 8] = vertex.c
	}

	set2(
		index: number,
		start: Vector3,
		s = 0,
		t = 0,
		u = 0,
		v = 0,
		p = 0,
		c = 0
	) {
		this.buffer[index * 9 + 0] = start.x
		this.buffer[index * 9 + 1] = start.y
		this.buffer[index * 9 + 2] = start.z
		this.buffer[index * 9 + 3] = s
		this.buffer[index * 9 + 4] = t
		this.buffer[index * 9 + 5] = u
		this.buffer[index * 9 + 6] = v
		this.buffer[index * 9 + 7] = p
		this.buffer[index * 9 + 8] = c
	}

	set3(
		index: number,
		x = 0,
		y = 0,
		z = 0,
		s = 0,
		t = 0,
		u = 0,
		v = 0,
		p = 0,
		c = 0
	) {
		this.buffer[index * 9 + 0] = x
		this.buffer[index * 9 + 1] = y
		this.buffer[index * 9 + 2] = z
		this.buffer[index * 9 + 3] = s
		this.buffer[index * 9 + 4] = t
		this.buffer[index * 9 + 5] = u
		this.buffer[index * 9 + 6] = v
		this.buffer[index * 9 + 7] = p
		this.buffer[index * 9 + 8] = c
	}
}
