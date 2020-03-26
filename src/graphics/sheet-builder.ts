import { Sheet } from './sheet'
import { TextureChannel, Sprite } from './sprite'
import { Vector2, Size, Vector3, Rectangle } from '../utils/math'
import { SpriteFrameType, SpriteFrame } from './sprite-loader'
import PNG from 'upng-js'
import { Util } from './utils'
import { BlendMode } from '../browser/rendering-context'

export class SheetOverflowException extends Error {
	constructor(message: string) {
		super(message)

		Object.setPrototypeOf(this, SheetOverflowException.prototype)
	}
}

//  The enum values indicate the number of channels used by the type
//  They are not arbitrary IDs!
export enum SheetType {
	Indexed = 1,
	BGRA = 4
}

export class SheetBuilder {
	type: SheetType
	sheets: Sheet[] = []
	allocateSheet: () => Sheet
	margin: number
	current: Sheet
	channel: TextureChannel
	rowHeight = 0

	p = new Vector2()

	static allocateSheet(type: SheetType, sheetSize: number) {
		return () => new Sheet(type, new Size(sheetSize, sheetSize))
	}

	static frameTypeToSheetType(t: SpriteFrameType): SheetType {
		switch (t) {
			case SpriteFrameType.Indexed:
				return SheetType.Indexed
				break
			case SpriteFrameType.BGRA:
				return SheetType.BGRA
				break
			default:
				throw new Error(`Unknown SpriteFrameType ${t}`)
		}
	}

	constructor(
		t: SheetType,
		b: (() => Sheet) | number = Game.settings.graphics.sheetSize,
		margin = 1
	) {
		if (typeof b === 'number') {
			this.allocateSheet = SheetBuilder.allocateSheet(t, b)
		} else {
			this.allocateSheet = b
		}

		this.channel =
			t == SheetType.Indexed ? TextureChannel.Red : TextureChannel.RGBA

		this.type = t
		this.current = this.allocateSheet()
		this.sheets.push(this.current)
		this.margin = margin
	}

	addFrame(frame: SpriteFrame): Sprite {
		return this.add(frame.data, frame.size, 0, Vector3.from(frame.offset))
	}

	add(
		src: Uint8ClampedArray,
		size: Size,
		zRamp = 0,
		spriteOffset = Vector3.zero
	): Sprite {
		//  Don't bother allocating empty sprites
		if (size.width == 0 || size.height == 0) {
			return new Sprite(
				this.current,
				Rectangle.empty,
				0,
				spriteOffset,
				this.channel,
				BlendMode.Alpha
			)
		}

		const rect = this.allocate(size, zRamp, spriteOffset)
		Util.fastCopyIntoChannel(rect, src)
		this.current.commitBufferedData()

		return rect
	}

	addPng(src: PNG.Image): Sprite {
		const rect = this.allocate(new Size(src.width, src.height))
		Util.fastCopyIntoSprite(rect, src)
		this.current.commitBufferedData()

		return rect
	}

	addEmpty(size: Size, paletteIndex: number): Sprite {
		const data = new Uint8ClampedArray(size.width * size.height)

		for (let i = 0; i < data.length; i++) {
			data[i] = paletteIndex
		}

		return this.add(data, size)
	}

	nextChannel(t: TextureChannel): TextureChannel | null {
		const nextChannel = t + this.type

		if (nextChannel > TextureChannel.Alpha) {
			return null
		}

		return nextChannel
	}

	allocate(imageSize: Size, zRamp = 0, spriteOffset = Vector3.zero): Sprite {
		if (imageSize.width + this.p.x + this.margin > this.current.size.width) {
			this.p = new Vector2(0, this.p.y + (this.rowHeight + this.margin))

			this.rowHeight = imageSize.height
		}

		if (imageSize.height > this.rowHeight) {
			this.rowHeight = imageSize.height
		}

		if (this.p.y + imageSize.height + this.margin > this.current.size.height) {
			const next = this.nextChannel(this.channel)

			if (next == null) {
				this.current.releaseBuffer()
				this.current = this.allocateSheet()
				this.sheets.push(this.current)

				this.channel =
					this.type == SheetType.Indexed
						? TextureChannel.Red
						: TextureChannel.RGBA
			} else {
				this.channel = next
			}

			this.rowHeight = imageSize.height
			this.p = Vector2.zero
		}

		const rect = new Sprite(
			this.current,
			new Rectangle(
				this.p.x + this.margin,
				this.p.y + this.margin,
				imageSize.width,
				imageSize.height
			),
			zRamp,
			spriteOffset,
			this.channel,
			BlendMode.Alpha
		)

		this.p = this.p.add(new Vector2(imageSize.width + this.margin, 0))

		return rect
	}

	get currentChannel(): TextureChannel {
		return this.channel
	}

	get allSheets(): Sheet[] {
		return this.sheets
	}
}
