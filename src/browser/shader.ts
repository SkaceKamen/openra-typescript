import { Texture } from './texture'

const shaderCode = {
	combined: {
		vert: require('./shaders/combined.vert'),
		frag: require('./shaders/combined.frag')
	} as const,
	model: {
		vert: require('./shaders/model.vert'),
		frag: require('./shaders/model.frag')
	} as const
} as const

export class Shader {
	static vertexPosAttributeIndex = 0
	static texCoordAttributeIndex = 1
	static texMetadataAttributeIndex = 2

	private static compileShaderObject(
		gl: WebGL2RenderingContext,
		type: number,
		name: 'combined' | 'model'
	) {
		const ext = type == gl.VERTEX_SHADER ? 'vert' : 'frag'
		const code = shaderCode[name][ext]
		const shader = gl.createShader(type) as WebGLShader
		gl.shaderSource(shader, code)
		gl.compileShader(shader)

		const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean

		if (!success) {
			throw new Error(`Compile error in shader object '${name}.${ext}'`)
		}

		return shader
	}

	gl: WebGL2RenderingContext
	program: WebGLProgram
	samplers: Record<string, number> = {}
	textures: Record<number, WebGLTexture> = {}
	unbindTextures: number[] = []

	constructor(gl: WebGL2RenderingContext, name: 'combined' | 'model') {
		this.gl = gl

		const vertexShader = Shader.compileShaderObject(gl, gl.VERTEX_SHADER, name)

		const fragmentShader = Shader.compileShaderObject(
			gl,
			gl.FRAGMENT_SHADER,
			name
		)

		//  Assemble program
		this.program = this.gl.createProgram() as WebGLProgram

		this.gl.bindAttribLocation(
			this.program,
			Shader.vertexPosAttributeIndex,
			'aVertexPosition'
		)

		this.gl.bindAttribLocation(
			this.program,
			Shader.texCoordAttributeIndex,
			'aVertexTexCoord'
		)

		this.gl.bindAttribLocation(
			this.program,
			Shader.texMetadataAttributeIndex,
			'aVertexTexMetadata'
		)

		this.gl.attachShader(this.program, vertexShader)
		this.gl.attachShader(this.program, fragmentShader)
		this.gl.linkProgram(this.program)

		const success = this.gl.getProgramParameter(
			this.program,
			this.gl.LINK_STATUS
		) as boolean

		if (!success) {
			throw new Error(`Link error in shader program '${name}'`)
		}

		this.gl.useProgram(this.program)

		const numUniforms: number = this.gl.getProgramParameter(
			this.program,
			this.gl.ACTIVE_UNIFORMS
		) as number

		let nextTexUnit = 0

		for (let i = 0; i < numUniforms; i++) {
			const uniform = this.gl.getActiveUniform(
				this.program,
				i
			) as WebGLActiveInfo

			if (uniform.type == this.gl.SAMPLER_2D) {
				this.samplers[uniform.name] = nextTexUnit
				const loc = this.gl.getUniformLocation(this.program, uniform.name)
				this.gl.uniform1i(loc, nextTexUnit)
				nextTexUnit++
			}
		}
	}

	prepareRender() {
		this.gl.useProgram(this.program)

		//  bind the textures
		Object.entries(this.textures).forEach(([index, item]) => {
			this.gl.activeTexture(this.gl.TEXTURE0 + parseInt(index, 10))
			this.gl.bindTexture(this.gl.TEXTURE_2D, item)
		})

		while (this.unbindTextures.length > 0) {
			const removed = this.unbindTextures.shift()

			if (removed !== undefined) {
				delete this.textures[removed]
			}
		}
	}

	setBool(name: string, value: boolean) {
		this.gl.useProgram(this.program)
		const param = this.gl.getUniformLocation(this.program, name)
		this.gl.uniform1i(param, value ? 1 : 0)
	}

	setMatrix(name: string, mtx: number[]) {
		if (mtx.length != 16) {
			throw new Error('Invalid 4x4 matrix')
		}

		this.gl.useProgram(this.program)
		const param = this.gl.getUniformLocation(this.program, name)
		this.gl.uniformMatrix4fv(param, false, mtx)
	}

	setTexture(name: string, t: Texture) {
		if (t == null) {
			return
		}

		const texUnit = this.samplers[name]

		if (texUnit !== undefined) {
			this.textures[texUnit] = t.internal
		}
	}

	setVec(name: string, x: number, y?: number, z?: number) {
		this.gl.useProgram(this.program)
		const param = this.gl.getUniformLocation(this.program, name)

		if (y !== undefined && z !== undefined) {
			this.gl.uniform3f(param, x, y, z)
		} else if (y !== undefined) {
			this.gl.uniform2f(param, x, y)
		} else {
			this.gl.uniform1f(param, x)
		}
	}

	setVecs(name: string, vec: number[], length: number) {
		const param = this.gl.getUniformLocation(this.program, name)

		switch (length) {
			case 1:
				this.gl.uniform1fv(param, vec)
				break
			case 2:
				this.gl.uniform2fv(param, vec)
				break
			case 3:
				this.gl.uniform3fv(param, vec)
				break
			case 4:
				this.gl.uniform4fv(param, vec)
				break
			default:
				throw new Error('Invalid vector length')
		}
	}
}
