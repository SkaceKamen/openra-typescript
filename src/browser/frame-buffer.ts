import { Texture } from './texture'
import { Size } from '../utils/types'
import { Color } from '../utils/color'
import { isPowerOf2, Rectangle } from '../utils/math'

export class FrameBuffer {
	texture: Texture
	size: Size
	clearColor: Color
	gl: WebGL2RenderingContext
	framebuffer: WebGLFramebuffer
	depth: WebGLRenderbuffer
	scissored = false

	constructor(
		gl: WebGL2RenderingContext,
		size: Size,
		texture: Texture,
		clearColor: Color
	) {
		this.gl = gl
		this.size = size
		this.clearColor = clearColor

		if (!isPowerOf2(this.size.width) || !isPowerOf2(this.size.height)) {
			throw new Error(
				`Frame buffer size (${size.width}x${size.height}) must be a power of two`
			)
		}

		// TODO: NULL CHECK
		this.framebuffer = this.gl.createFramebuffer() as WebGLFramebuffer

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer)

		//  Color
		this.texture = texture
		this.texture.setEmpty(this.size.width, this.size.height)

		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER,
			this.gl.COLOR_ATTACHMENT0,
			this.gl.TEXTURE_2D,
			this.texture.internal,
			0
		)

		//  Depth
		// TODO: NULL CHECK
		this.depth = this.gl.createRenderbuffer() as WebGLRenderbuffer
		this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.depth)

		const glDepth = this.gl.DEPTH_COMPONENT16

		this.gl.renderbufferStorage(
			this.gl.RENDERBUFFER,
			glDepth,
			this.size.width,
			this.size.height
		)

		this.gl.framebufferRenderbuffer(
			this.gl.FRAMEBUFFER,
			this.gl.DEPTH_ATTACHMENT,
			this.gl.RENDERBUFFER,
			this.depth
		)

		//  Test for completeness
		const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER)

		if (status != this.gl.FRAMEBUFFER_COMPLETE) {
			throw new Error(`Failed to create framebuffer`)
		}

		//  Restore default buffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
	}

	cv: number[] = new Array(4)

	viewportRectangle(): number[] {
		const v = this.gl.getParameter(this.gl.VIEWPORT) as Int32Array

		return Array.from(v)
	}

	bind() {
		//  Cache viewport rect to restore when unbinding
		this.cv = this.viewportRectangle()
		this.gl.flush()
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer)
		this.gl.viewport(0, 0, this.size.width, this.size.height)

		this.gl.clearColor(
			this.clearColor.r,
			this.clearColor.g,
			this.clearColor.b,
			this.clearColor.a
		)

		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
	}

	disableScissor() {
		this.gl.disable(this.gl.SCISSOR_TEST)
		this.scissored = false
	}

	enableScissor(rect: Rectangle) {
		this.gl.scissor(
			rect.left,
			rect.top,
			Math.max(rect.width, 0),
			Math.max(rect.height, 0)
		)

		this.gl.enable(this.gl.SCISSOR_TEST)
		this.scissored = true
	}

	unbind() {
		if (this.scissored) {
			throw new Error(
				'Attempting to unbind FrameBuffer with an active scissor region.'
			)
		}

		this.gl.flush()
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
		this.gl.viewport(this.cv[0], this.cv[1], this.cv[2], this.cv[3])
	}
}
