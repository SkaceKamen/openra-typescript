import { isPowerOf2, Size } from '../utils/math'

export enum TextureScaleFilter {
	Nearest,
	Linear
}

export class Texture {
	internal: WebGLTexture

	_scaleFilter: TextureScaleFilter = TextureScaleFilter.Nearest

	get scaleFilter() {
		return this._scaleFilter
	}

	set scaleFilter(v) {
		this._scaleFilter = v

		this.prepareTexture()
	}

	size: Size = new Size(0, 0)
	gl: WebGL2RenderingContext

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl

		// TODO: NULL CHECK
		this.internal = this.gl.createTexture() as WebGLTexture
	}

	prepareTexture() {
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.internal)

		const filter =
			this.scaleFilter == TextureScaleFilter.Linear
				? this.gl.LINEAR
				: this.gl.NEAREST

		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_MAG_FILTER,
			filter
		)

		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_MIN_FILTER,
			filter
		)

		this.gl.texParameterf(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_WRAP_S,
			this.gl.CLAMP_TO_EDGE
		)

		this.gl.texParameterf(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_WRAP_T,
			this.gl.CLAMP_TO_EDGE
		)

		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_BASE_LEVEL, 0)
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAX_LEVEL, 0)
	}

	setData(data: Uint8ClampedArray, width: number, height: number) {
		if (!isPowerOf2(width) || !isPowerOf2(height)) {
			throw new Error(`Non-power-of-two array ${width}x${height}`)
		}

		this.size = new Size(width, height)

		this.gl.texImage2D(
			this.gl.TEXTURE_2D, // target
			0, // level
			this.gl.RGBA, // internal format
			width, // width
			height, // height
			0, // border
			this.gl.RGBA, // format
			this.gl.UNSIGNED_BYTE, // type
			data /* pixels */
		)
	}

	getData() {
		const data = new Uint8ClampedArray(4 * (this.size.width * this.size.height))

		//  Query the active framebuffer so we can restore it afterwards
		const lastFramebuffer = this.gl.getParameter(
			this.gl.FRAMEBUFFER_BINDING
		) as WebGLFramebuffer

		const framebuffer = this.gl.createFramebuffer()
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)

		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER,
			this.gl.COLOR_ATTACHMENT0,
			this.gl.TEXTURE_2D,
			this.internal,
			0
		)

		const canReadBGRA = false

		const buffer: Uint8Array = new Uint8Array(
			this.size.width * (this.size.height * 4)
		)

		const format = this.gl.RGBA

		this.gl.readPixels(
			0,
			0,
			this.size.width,
			this.size.height,
			format,
			this.gl.UNSIGNED_BYTE,
			buffer
		)

		//  Convert RGBA to BGRA
		if (!canReadBGRA) {
			for (let i = 0; i < 4 * (this.size.width * this.size.height); i += 4) {
				const temp = data[i]
				data[i] = data[i + 2]
				data[i + 2] = temp
			}
		}

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, lastFramebuffer)
		this.gl.deleteFramebuffer(framebuffer)

		return data
	}

	setEmpty(width: number, height: number) {
		if (!isPowerOf2(width) || !isPowerOf2(height)) {
			throw new Error(`Non-power-of-two array ${width}x${height}`)
		}

		this.size = new Size(width, height)
		const buffer = new Uint8ClampedArray(width * (height * 4))
		this.setData(buffer, width, height)
	}
}
