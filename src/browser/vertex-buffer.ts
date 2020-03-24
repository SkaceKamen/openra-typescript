import { VertexArray } from './vertex-array'
import { Shader } from './shader'

export class VertexBuffer {
	buffer: WebGLBuffer
	gl: WebGL2RenderingContext

	private size: number

	constructor(gl: WebGL2RenderingContext, size: number) {
		this.size = size
		this.gl = gl
		this.buffer = this.gl.createBuffer() as WebGLBuffer
		this.bind()

		//  TODO: Do we need to zero the data?
		//  Generates a buffer with uninitialized memory.
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array(this.size * 9),
			this.gl.DYNAMIC_DRAW
		)
	}

	setData(data: VertexArray, start: number) {
		this.bind()
		this.gl.bufferSubData(this.gl.ARRAY_BUFFER, start * 9, data.buffer)
	}

	bind() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer)

		this.gl.vertexAttribPointer(
			Shader.vertexPosAttributeIndex,
			3,
			this.gl.FLOAT,
			false,
			9 * 4,
			0
		)

		this.gl.vertexAttribPointer(
			Shader.texCoordAttributeIndex,
			4,
			this.gl.FLOAT,
			false,
			9 * 4,
			12
		)

		this.gl.vertexAttribPointer(
			Shader.texMetadataAttributeIndex,
			2,
			this.gl.FLOAT,
			false,
			9 * 4,
			28
		)
	}
}
