import { DataStream } from '../utils/stream'
import { Size, Vector2 } from '../utils/math'
import { SheetBuilder } from './sheet-builder'
import { ReadOnlyFileSystem } from '../file-system/types'
import { Sprite } from './sprite'
import { range } from '../utils/collections'
import { AsyncRecordCache } from '../utils/cache'

export enum SpriteFrameType {
	Indexed,
	BGRA
}

export interface SpriteLoader {
	tryParseSprite(s: DataStream): SpriteFrame[] | null
}

export interface SpriteFrame {
	type: SpriteFrameType

	///  <summary>
	///  Size of the frame's `Data`.
	///  </summary>
	size: Size

	///  <summary>
	///  Size of the entire frame including the frame's `Size`.
	///  Think of this like a picture frame.
	///  </summary>
	frameSize: Size

	offset: Vector2
	data: Uint8ClampedArray
	disableExportPadding: boolean
}

export class SpriteCache {
	sheetBuilders: Record<SpriteFrameType, SheetBuilder>
	loaders: SpriteLoader[]
	fileSystem: ReadOnlyFileSystem
	sprites: Record<string, Sprite[][]> = {}
	unloadedFrames: Record<string, (SpriteFrame | null)[]> = {}

	constructor(fileSystem: ReadOnlyFileSystem, loaders: SpriteLoader[]) {
		this.sheetBuilders = {
			[SpriteFrameType.Indexed]: new SheetBuilder(
				SheetBuilder.frameTypeToSheetType(SpriteFrameType.Indexed)
			),
			[SpriteFrameType.BGRA]: new SheetBuilder(
				SheetBuilder.frameTypeToSheetType(SpriteFrameType.BGRA)
			)
		}

		this.fileSystem = fileSystem
		this.loaders = loaders
	}

	///  <summary>
	///  Returns the first set of sprites with the given filename.
	///  If getUsedFrames is defined then the indices returned by the function call
	///  are guaranteed to be loaded.  The value of other indices in the returned
	///  array are undefined and should never be accessed.
	///  </summary>
	async get(
		filename: string,
		getUsedFrames: ((length: number) => number[]) | null = null
	) {
		if (!this.sprites[filename]) {
			this.sprites[filename] = []
		}

		const allSprites = this.sprites[filename]
		let sprite = allSprites[0]
		let unloaded = this.unloadedFrames[filename]

		//  This is the first time that the file has been requested
		//  Load all of the frames into the unused buffer and initialize
		//  the loaded cache (initially empty)
		if (sprite) {
			unloaded = await FrameLoader.getFramesFromFile(
				this.fileSystem,
				filename,
				this.loaders
			)

			this.unloadedFrames[filename] = unloaded

			sprite = new Array(unloaded.length)
			allSprites.push(sprite)
		}

		//  HACK: The sequence code relies on side-effects from getUsedFrames
		const indices = getUsedFrames
			? getUsedFrames(sprite.length)
			: range(0, sprite.length)

		//  Load any unused frames into the SheetBuilder
		if (unloaded) {
			for (const i of indices) {
				const un = unloaded[i]

				if (un) {
					sprite[i] = this.sheetBuilders[un.type].addFrame(un)
					unloaded[i] = null
				}
			}

			//  All frames have been loaded
			if (unloaded.every(i => i === null)) {
				delete this.unloadedFrames[filename]
			}
		}

		return sprite
	}
}
export class FrameCache {
	frames: AsyncRecordCache<string, SpriteFrame[]>

	constructor(fileSystem: ReadOnlyFileSystem, loaders: SpriteLoader[]) {
		this.frames = new AsyncRecordCache(filename =>
			FrameLoader.getFramesFromFile(fileSystem, filename, loaders)
		)
	}

	async get(filename: string) {
		return this.frames.get(filename)
	}
}

export class FrameLoader {
	static async getFramesFromFile(
		fileSystem: ReadOnlyFileSystem,
		filename: string,
		loaders: SpriteLoader[]
	) {
		const stream = await fileSystem.open(filename)

		const spriteFrames = FrameLoader.getFramesFromStream(stream, loaders)

		if (spriteFrames == null) {
			throw new Error(filename + ' is not a valid sprite file!')
		}

		return spriteFrames
	}

	static getFramesFromStream(
		stream: DataStream,
		loaders: SpriteLoader[]
	): SpriteFrame[] | null {
		for (const loader of loaders) {
			const frames = loader.tryParseSprite(stream)

			if (frames) {
				return frames
			}
		}

		return null
	}
}
