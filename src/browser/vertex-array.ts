export class VertexArray {
	buffer: Float32Array

	private size: number

	constructor(size: number) {
		this.size = size
		this.buffer = new Float32Array(size * 9)
	}
}
