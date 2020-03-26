import { Rectangle, Vector2, Vector3 } from '../utils/math'
import { BlendMode } from '../utils/types'
import { Sheet } from './sheet'

export class Sprite {
	bounds: Rectangle

	sheet: Sheet

	blendMode: BlendMode

	channel: TextureChannel

	zRamp: number

	size: Vector3

	offset: Vector3

	fractionalOffset: Vector3

	top: number

	left: number

	bottom: number

	right: number

	static create(sheet: Sheet, bounds: Rectangle, channel: TextureChannel) {
		return new Sprite(sheet, bounds, 0, Vector3.zero, channel)
	}

	constructor(
		sheet: Sheet,
		bounds: Rectangle,
		zRamp: number,
		offset: Vector3,
		channel: TextureChannel,
		blendMode: BlendMode = BlendMode.Alpha
	) {
		this.sheet = sheet
		this.bounds = bounds
		this.offset = offset
		this.zRamp = zRamp
		this.channel = channel

		this.size = new Vector3(
			bounds.size.width,
			bounds.size.height,
			bounds.size.height * zRamp
		)

		this.blendMode = blendMode

		this.fractionalOffset =
			this.size.z != 0
				? offset.div(this.size)
				: new Vector3(offset.x / this.size.x, offset.y / this.size.y, 0)

		this.left =
			Math.min(bounds.left, bounds.right) * (sheet.DPIScale / sheet.size.width)

		this.top =
			Math.min(bounds.top, bounds.bottom) * (sheet.DPIScale / sheet.size.height)

		this.right =
			Math.max(bounds.left, bounds.right) * (sheet.DPIScale / sheet.size.width)

		this.bottom =
			Math.max(bounds.top, bounds.bottom) * (sheet.DPIScale / sheet.size.height)
	}
}

export class SpriteWithSecondaryData extends Sprite {
	secondarySheet: Sheet

	secondaryBounds: Rectangle

	secondaryChannel: TextureChannel

	secondaryTop: number

	secondaryLeft: number

	secondaryBottom: number

	secondaryRight: number

	constructor(
		s: Sprite,
		secondarySheet: Sheet,
		secondaryBounds: Rectangle,
		secondaryChannel: TextureChannel
	) {
		super(s.sheet, s.bounds, s.zRamp, s.offset, s.channel, s.blendMode)

		this.secondarySheet = secondarySheet
		this.secondaryBounds = secondaryBounds
		this.secondaryChannel = secondaryChannel

		this.secondaryLeft =
			Math.min(secondaryBounds.left, secondaryBounds.right) *
			(secondarySheet.DPIScale / s.sheet.size.width)

		this.secondaryTop =
			Math.min(secondaryBounds.top, secondaryBounds.bottom) *
			(secondarySheet.DPIScale / s.sheet.size.height)

		this.secondaryRight =
			Math.max(secondaryBounds.left, secondaryBounds.right) *
			(secondarySheet.DPIScale / s.sheet.size.width)

		this.secondaryBottom =
			Math.max(secondaryBounds.top, secondaryBounds.bottom) *
			(secondarySheet.DPIScale / s.sheet.size.height)
	}
}

export enum TextureChannel {
	Red = 0,
	Green = 1,
	Blue = 2,
	Alpha = 3,
	RGBA = 4
}
