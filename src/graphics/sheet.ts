import { Texture } from '../browser/texture'
import { Size, Rectangle } from '../utils/math'
import PNG from 'upng-js'
import { Sprite, TextureChannel } from './sprite'
import { Game } from '../game'
import { Logger } from '../log'
import { SheetType } from '../utils/types'
import { Util } from './utils'

export class Sheet {
	dirty = false

	releaseBufferOnCommit = false

	texture: Texture | null = null

	data: Uint8ClampedArray | null = null

	size: Size = new Size(0, 0)

	type: SheetType

	DPIScale = 1

	getData() {
		this.createBuffer()

		return this.data as Uint8ClampedArray
	}

	get buffered(): boolean {
		return this.data != null || this.texture == null
	}

	constructor(type: SheetType, b: Size | Texture | ArrayBuffer) {
		this.type = type

		if (b instanceof Size) {
			this.size = b
		}

		if (b instanceof Texture) {
			this.texture = b
			this.size = this.texture.size
		}

		if (b instanceof ArrayBuffer) {
			const png = PNG.decode(b)
			this.size = new Size(png.width, png.height)

			this.data = new Uint8ClampedArray(
				4 * (this.size.width * this.size.height)
			)

			Util.fastCopyIntoSprite(
				Sprite.create(
					this,
					new Rectangle(0, 0, png.width, png.height),
					TextureChannel.Red
				),
				png
			)

			this.type = type
			this.releaseBuffer()
		}
	}

	getTexture(): Texture {
		if (this.texture === null) {
			this.texture = Game.renderer.context.createTexture()
			this.dirty = true
		}

		if (this.texture !== null && this.data != null && this.dirty) {
			this.texture.setData(this.data, this.size.width, this.size.height)
			this.dirty = false

			if (this.releaseBufferOnCommit) {
				this.data = null
			}
		}

		return this.texture as Texture
	}

	asPng(channel?: TextureChannel, pal?: Palette): ArrayBuffer {
		if (channel === undefined && pal === undefined) {
			const data = new Uint8ClampedArray(this.getData().buffer.slice(0))

			//  Convert BGRA to RGBA
			for (let i = 0; i < this.size.width * this.size.height; i++) {
				const temp = data[i * 4]
				data[i * 4] = data[i * 4 + 2]
				data[i * 4 + 2] = temp
			}

			return PNG.encode([data.buffer], this.size.width, this.size.height, 0)
		} else {
			const d = this.getData()
			const plane = new Uint8ClampedArray(this.size.width * this.size.height)
			const dataStride = 4 * this.size.width
			const channelOffset = channel as TextureChannel

			for (let y = 0; y < this.size.height; y++) {
				for (let x = 0; x < this.size.width; x++) {
					plane[y * this.size.width + x] =
						d[y * dataStride + (channelOffset + 4 * x)]
				}
			}

			/*
			TODO:
			const palColors: Color[] = []
			for (let i = 0; i < Palette.size; i++) {
				palColors[i] = pal.GetColor(i)
			}
			*/

			Logger.warn('Trying to convert sheet to png with unsupported palette')

			return PNG.encode([plane.buffer], this.size.width, this.size.height, 0)
		}
	}

	createBuffer() {
		if (this.data != null) {
			return
		}

		if (this.texture == null) {
			this.data = new Uint8ClampedArray(
				4 * (this.size.width * this.size.height)
			)
		} else {
			this.data = this.texture.getData()
		}

		this.releaseBufferOnCommit = false
	}

	commitBufferedData() {
		if (!this.buffered) {
			throw new Error(
				'This sheet is unbuffered. You cannot call CommitBufferedData on an unbuffered sheet. ' +
					('If you need to completely replace the texture data you should set data into the texture directly. ' +
						'If you need to make only small changes to the texture data consider creating a buffered sheet instead.')
			)
		}

		this.dirty = true
	}

	releaseBuffer() {
		if (!this.buffered) {
			return
		}

		this.dirty = true
		this.releaseBufferOnCommit = true

		//  Commit data from the buffer to the texture, allowing the buffer to be released and reclaimed by GC.
		if (Game.renderer != null) {
			this.getTexture()
		}
	}
}
