import { VertexBuffer } from './vertex-buffer'
import { Texture } from './texture'
import { Size } from '../utils/types'
import { FrameBuffer } from './frame-buffer'
import { Color } from '../utils/color'
import { Shader } from './shader'

export enum PrimitiveType {
	PointList,
	LineList,
	TriangleList
}

export enum BlendMode {
	None,
	Alpha,
	Additive,
	Subtractive,
	Multiply,
	Multiplicative,
	DoubleMultiplicative
}

const modeFromPrimitiveType = {
	[PrimitiveType.PointList]: 'POINTS',
	[PrimitiveType.LineList]: 'LINES',
	[PrimitiveType.TriangleList]: 'TRIANGLES'
} as const

export interface GameRenderingContext {
	createVertexBuffer(size: number): VertexBuffer
	createTexture(): Texture
	createFrameBuffer(s: Size, clearColor?: Color): FrameBuffer
	createShader(name: string): Promise<Shader>

	enableScissor(x: number, y: number, width: number, height: number): void
	disableScissor(): void
	present(): void
	drawPrimitives(
		pt: PrimitiveType,
		firstVertex: number,
		numVertices: number
	): void
	clear(): void
	enableDepthBuffer(): void
	disableDepthBuffer(): void
	clearDepthBuffer(): void
	setBlendMode(mode: BlendMode): void
}

export class WebRenderingContext implements GameRenderingContext {
	private gl: WebGL2RenderingContext

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl2')

		if (gl === null) {
			throw new Error("Browser doesn't support WebGL2")
		}

		this.gl = gl
	}

	createVertexBuffer(size: number): VertexBuffer {
		return new VertexBuffer(this.gl, size)
	}

	createTexture(): Texture {
		return new Texture(this.gl)
	}

	createFrameBuffer(s: Size, clearColor?: Color) {
		return new FrameBuffer(
			this.gl,
			s,
			this.createTexture(),
			clearColor || new Color(0, 0, 0, 0)
		)
	}

	async createShader(name: string) {
		return Shader.create(this.gl, name)
	}

	enableScissor(x: number, y: number, width: number, height: number): void {
		if (width < 0) {
			width = 0
		}

		if (height < 0) {
			height = 0
		}

		this.gl.scissor(x, y, width, height)
		this.gl.enable(this.gl.SCISSOR_TEST)
	}

	disableScissor(): void {
		this.gl.disable(this.gl.DEPTH_TEST)
	}

	present(): void {
		throw new Error('Method not implemented.')
	}

	drawPrimitives(
		pt: PrimitiveType,
		firstVertex: number,
		numVertices: number
	): void {
		this.gl.drawArrays(
			this.gl[modeFromPrimitiveType[pt]],
			firstVertex,
			numVertices
		)
	}

	clear(): void {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
	}

	enableDepthBuffer(): void {
		this.gl.clear(this.gl.DEPTH_BUFFER_BIT)
		this.gl.enable(this.gl.DEPTH_TEST)
		this.gl.depthFunc(this.gl.LEQUAL)
	}

	disableDepthBuffer(): void {
		this.gl.disable(this.gl.DEPTH_TEST)
	}

	clearDepthBuffer(): void {
		this.gl.clear(this.gl.DEPTH_BUFFER_BIT)
	}

	setBlendMode(mode: BlendMode): void {
		this.gl.blendEquation(this.gl.FUNC_ADD)

		switch (mode) {
			case BlendMode.None:
				this.gl.disable(this.gl.BLEND)
				break
			case BlendMode.Alpha:
				this.gl.enable(this.gl.BLEND)
				this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA)
				break
			case BlendMode.Additive:
			case BlendMode.Subtractive:
				this.gl.enable(this.gl.BLEND)
				this.gl.blendFunc(this.gl.ONE, this.gl.ONE)

				if (mode == BlendMode.Subtractive) {
					this.gl.blendEquationSeparate(
						this.gl.FUNC_REVERSE_SUBTRACT,
						this.gl.FUNC_ADD
					)
				}

				break
			case BlendMode.Multiply:
				this.gl.enable(this.gl.BLEND)
				this.gl.blendFunc(this.gl.DST_COLOR, this.gl.ONE_MINUS_SRC_ALPHA)
				break
			case BlendMode.Multiplicative:
				this.gl.enable(this.gl.BLEND)
				this.gl.blendFunc(this.gl.ZERO, this.gl.SRC_COLOR)
				break
			case BlendMode.DoubleMultiplicative:
				this.gl.enable(this.gl.BLEND)
				this.gl.blendFunc(this.gl.DST_COLOR, this.gl.SRC_COLOR)
				break
		}
	}
}
