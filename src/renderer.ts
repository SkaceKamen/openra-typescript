import {
	GameRenderingContext,
	PrimitiveType
} from './browser/rendering-context'
import { VertexBuffer } from './browser/vertex-buffer'
import { FrameBuffer } from './browser/frame-buffer'
import { BrowserPlatform } from './platform/browser'
import { Rectangle, Vector2, Size, Vector3 } from './utils/math'
import { Texture, TextureScaleFilter } from './browser/texture'
import { Shader } from './browser/shader'
import { BrowserWindow } from './browser/window'
import { Game } from './game'
import { Color } from './utils/color'
import { FontRenderer } from './browser/font-renderer'
import { VertexArray } from './browser/vertex-array'
import { Sprite } from './graphics/sprite'

enum RenderType {
	None,
	World,
	UI
}

export interface BatchRenderer {
	flush(): void
}

export class Renderer {
	worldSpriteRenderer: SpriteRenderer
	worldRgbaSpriteRenderer: RgbaSpriteRenderer
	worldRgbaColorRenderer: RgbaColorRenderer
	worldModelRenderer: ModelRenderer
	rgbaColorRenderer: RgbaColorRenderer
	spriteRenderer: SpriteRenderer
	rgbaSpriteRenderer: RgbaSpriteRenderer
	fonts: Record<string, SpriteFont>
	context: GameRenderingContext

	private sheetSize: number
	private tempBufferSize: number

	tempBuffer: VertexBuffer

	// TODO: Stack?
	scissorState: Rectangle[] = []

	screenBuffer: FrameBuffer

	screenSprite: Sprite

	worldBuffer: FrameBuffer

	worldSprite: Sprite

	fontSheetBuilder: SheetBuilder

	window: BrowserWindow

	platform: BrowserPlatform

	depthMargin: number

	lastBufferSize: Size = new Size(-1, -1)

	lastWorldBufferSize: Size = new Size(-1, -1)

	lastWorldViewport: Rectangle = Rectangle.Empty

	currentPaletteTexture: Texture

	_currentBatchRenderer: IBatchRenderer

	renderType: RenderType = RenderType.None

	constructor(platform: BrowserPlatform, graphicSettings: GraphicSettings) {
		this.platform = platform
		this.window = platform.createWindow()
		this.context = platform.createContext()
		this.tempBufferSize = graphicSettings.BatchSize
		this.sheetSize = graphicSettings.SheetSize

		this.worldSpriteRenderer = new SpriteRenderer(
			this,
			this.context.createShader('combined')
		)

		this.worldRgbaSpriteRenderer = new RgbaSpriteRenderer(
			this.worldSpriteRenderer
		)

		this.worldRgbaColorRenderer = new RgbaColorRenderer(
			this.worldSpriteRenderer
		)

		this.worldModelRenderer = new ModelRenderer(
			this,
			this.context.createShader('model')
		)

		this.spriteRenderer = new SpriteRenderer(
			this,
			this.context.createShader('combined')
		)

		this.rgbaSpriteRenderer = new RgbaSpriteRenderer(this.spriteRenderer)
		this.rgbaColorRenderer = new RgbaColorRenderer(this.spriteRenderer)
		this.tempBuffer = this.context.createVertexBuffer(this.tempBufferSize)
	}
	setUIScale(scale: number) {
		// this.window.SetScaleModifier(scale);
		// TODO: How?
	}

	initializeFonts(modData: ModData) {
		this.fontSheetBuilder = new SheetBuilder(SheetType.BGRA, 512)

		this.fonts = modData.manifest.fontList.map(
			item =>
				new SpriteFont(
					item.font,
					null,
					item.size,
					item.ascender,
					1,
					this.fontSheetBuilder
				)
		)

		Game.runAfterTick(() => {
			this.window.onWindowScaleChanged.on(e => {
				ChromeProvider.setDPIScale(e.new)

				for (const f of Object.values(this.fonts)) {
					f.setScale(e.new)
				}
			})
		})
	}

	initializeDepthBuffer(mapGrid: MapGrid) {
		//  The depth buffer needs to be initialized with enough range to cover:
		//   - the height of the screen
		//   - the z-offset of tiles from MaxTerrainHeight below the bottom of the screen (pushed into view)
		//   - additional z-offset from actors on top of MaxTerrainHeight terrain
		//   - a small margin so that tiles rendered partially above the top edge of the screen aren't pushed behind the clip plane
		//  We need an offset of mapGrid.MaximumTerrainHeight * mapGrid.TileSize.Height / 2 to cover the terrain height
		//  and choose to use mapGrid.MaximumTerrainHeight * mapGrid.TileSize.Height / 4 for each of the actor and top-edge cases
		this.depthMargin =
			mapGrid == null || !mapGrid.EnableDepthBuffer
				? 0
				: mapGrid.maximumTerrainHeight * mapGrid.tileSize.height
	}

	beginFrame() {
		this.context.clear()

		const surfaceSize = this.window.surfaceSize
		const surfaceBufferSize = surfaceSize.nextPowerOf2()

		if (
			this.screenSprite == null ||
			this.screenSprite.Sheet.Size != surfaceBufferSize
		) {
			//  Render the screen into a frame buffer to simplify reading back screenshots
			this.screenBuffer = this.context.createFrameBuffer(
				surfaceBufferSize,
				new Color(0, 0, 0, 255)
			)
		}

		if (
			this.screenSprite == null ||
			surfaceSize.width != this.screenSprite.Bounds.Width ||
			surfaceSize.height * -1 != this.screenSprite.Bounds.Height
		) {
			const screenSheet = new Sheet(SheetType.BGRA, this.screenBuffer.texture)

			//  Flip sprite in Y to match OpenGL's bottom-left origin
			const screenBounds = Rectangle.fromLTRB(
				0,
				surfaceSize.height,
				surfaceSize.width,
				0
			)

			this.screenSprite = new Sprite(
				screenSheet,
				screenBounds,
				TextureChannel.RGBA
			)
		}

		//  In HiDPI windows we follow Apple's convention of defining window coordinates as for standard resolution windows
		//  but to have a higher resolution backing surface with more than 1 texture pixel per viewport pixel.
		//  We must convert the surface buffer size to a viewport size - in general this is NOT just the window size
		//  rounded to the next power of two, as the NextPowerOf2 calculation is done in the surface pixel coordinates
		const scale = this.window.effectiveWindowScale

		const bufferSize = new Size(
			surfaceBufferSize.width / scale,
			surfaceBufferSize.height / scale
		)

		if (this.lastBufferSize != bufferSize) {
			this.spriteRenderer.setViewportParams(bufferSize, 0, 0, Vector2.zero)
			this.lastBufferSize = bufferSize
		}
	}

	beginWorld(worldViewport: Rectangle) {
		if (this.renderType != RenderType.None) {
			throw new Error(
				`BeginWorld called with renderType = {${this.renderType}}, expected RenderType.None.`
			)
		}

		this.beginFrame()
		const worldBufferSize = worldViewport.size.nextPowerOf2()

		if (
			this.worldSprite == null ||
			this.worldSprite.Sheet.Size != worldBufferSize
		) {
			//  Render the world into a framebuffer at 1:1 scaling to allow the depth buffer to match the artwork at all zoom levels
			this.worldBuffer = this.context.createFrameBuffer(worldBufferSize)
			//  Pixel art scaling mode is a customized bilinear sampling
			this.worldBuffer.texture.scaleFilter = TextureScaleFilter.Linear
		}

		if (
			this.worldSprite == null ||
			worldViewport.size != this.worldSprite.Bounds.Size
		) {
			const worldSheet = new Sheet(SheetType.BGRA, this.worldBuffer.texture)

			this.worldSprite = new Sprite(
				worldSheet,
				Rectangle.fromPosSize(Vector2.zero, worldViewport.size),
				TextureChannel.RGBA
			)
		}

		this.worldBuffer.bind()

		if (
			worldBufferSize != this.lastWorldBufferSize ||
			this.lastWorldViewport != worldViewport
		) {
			const depthScale =
				worldBufferSize.height / (worldBufferSize.height + this.depthMargin)

			this.worldSpriteRenderer.setViewportParams(
				worldBufferSize,
				depthScale,
				depthScale / 2,
				worldViewport.location
			)

			this.worldModelRenderer.setViewportParams(
				worldBufferSize,
				worldViewport.location
			)

			this.lastWorldViewport = worldViewport
			this.lastWorldBufferSize = worldBufferSize
		}

		this.renderType = RenderType.World
	}

	beginUI() {
		if (this.renderType == RenderType.World) {
			//  Complete world rendering
			this.flush()
			this.worldBuffer.unbind()
			//  Render the world buffer into the UI buffer
			this.screenBuffer.bind()
			const scale = this.window.effectiveWindowScale

			const bufferSize = new Size(
				this.screenSprite.bounds.width / scale,
				(this.screenSprite.bounds.height / scale) * -1
			)

			this.spriteRenderer.setAntialiasingPixelsPerTexel(
				this.window.surfaceSize.height * (1 / this.worldSprite.Bounds.Height)
			)

			this.rgbaSpriteRenderer.drawSprite(
				this.worldSprite,
				Vector3.zero,
				Vector2.fromSize(bufferSize)
			)

			this.flush()
			this.spriteRenderer.setAntialiasingPixelsPerTexel(0)
		} else {
			//  World rendering was skipped
			this.beginFrame()
			this.screenBuffer.bind()
		}

		this.renderType = RenderType.UI
	}

	setPalette(palette: HardwarePalette) {
		if (palette.Texture == this.currentPaletteTexture) {
			return
		}

		this.flush()
		this.currentPaletteTexture = palette.Texture
		this.spriteRenderer.setPalette(this.currentPaletteTexture)
		this.worldSpriteRenderer.setPalette(this.currentPaletteTexture)
		this.worldModelRenderer.setPalette(this.currentPaletteTexture)
	}

	endFrame(inputHandler: InputHandler) {
		if (this.renderType != RenderType.UI) {
			throw new Error(
				`EndFrame called with renderType = {${this.renderType}}, expected RenderType.UI.`
			)
		}

		this.flush()
		this.screenBuffer.bind()

		//  Render the compositor buffers to the screen
		//  HACK / PERF: Fudge the coordinates to cover the actual window while keeping the buffer viewport parameters
		//  This saves us two redundant (and expensive) SetViewportParams each frame
		this.rgbaSpriteRenderer.drawSprite(
			this.screenSprite,
			new Vector3(0, this.lastBufferSize.height, 0),
			new Vector3(this.lastBufferSize.width, this.lastBufferSize.height * -1, 0)
		)

		this.flush()
		this.window.pumpInput(inputHandler)
		this.context.present()
		this.renderType = RenderType.None
	}

	drawBatch(
		vertices: VertexBuffer | VertexArray,
		firstVertex: number,
		numVertices: number,
		type: PrimitiveType
	) {
		if (vertices instanceof VertexArray) {
			this.tempBuffer.setData(vertices, numVertices)
			vertices = this.tempBuffer
		}

		vertices.bind()
		this.context.drawPrimitives(type, firstVertex, numVertices)
	}

	flush() {
		this._currentBatchRenderer = null
	}

	get resolution(): Size {
		return this.window.effectiveWindowSize
	}

	get nativeResolution(): Size {
		return this.window.nativeWindowSize
	}

	get windowScale(): number {
		return this.window.effectiveWindowScale
	}

	get nativeWindowScale(): number {
		return this.window.nativeWindowScale
	}

	get currentBatchRenderer(): BatchRenderer {
		return this._currentBatchRenderer
	}

	set currentBatchRenderer(value: BatchRenderer) {
		if (this._currentBatchRenderer == value) {
			return
		}

		if (this._currentBatchRenderer != null) {
			this._currentBatchRenderer.flush()
		}

		this._currentBatchRenderer = value
	}

	createVertexBuffer(length: number): VertexBuffer {
		return this.context.createVertexBuffer(length)
	}

	enableScissor(rect: Rectangle) {
		//  Must remain inside the current scissor rect
		if (this.scissorState.length > 0) {
			rect = Rectangle.intersect(
				rect,
				this.scissorState[this.scissorState.length - 1]
			)
		}

		this.flush()

		if (this.renderType == RenderType.World) {
			this.worldBuffer.enableScissor(rect)
		} else {
			this.context.enableScissor(rect.left, rect.top, rect.width, rect.height)
		}

		this.scissorState.push(rect)
	}

	disableScissor() {
		this.scissorState.pop()
		this.flush()

		if (this.renderType == RenderType.World) {
			//  Restore previous scissor rect
			if (this.scissorState.length > 0) {
				this.worldBuffer.enableScissor(
					this.scissorState[this.scissorState.length - 1]
				)
			} else {
				this.worldBuffer.disableScissor()
			}
		} else {
			//  Restore previous scissor rect
			if (this.scissorState.length > 0) {
				const rect = this.scissorState[this.scissorState.length - 1]
				this.context.enableScissor(rect.left, rect.top, rect.width, rect.height)
			} else {
				this.context.disableScissor()
			}
		}
	}

	enableDepthBuffer() {
		this.flush()
		this.context.enableDepthBuffer()
	}

	disableDepthBuffer() {
		this.flush()
		this.context.disableDepthBuffer()
	}

	clearDepthBuffer() {
		this.flush()
		this.context.clearDepthBuffer()
	}

	enableAntialiasingFilter() {
		if (this.renderType != RenderType.UI) {
			throw new Error(
				`EndFrame called with renderType = ${this.renderType}, expected RenderType.UI.`
			)
		}

		this.flush()

		this.spriteRenderer.setAntialiasingPixelsPerTexel(
			this.window.effectiveWindowScale
		)
	}

	disableAntialiasingFilter() {
		if (this.renderType != RenderType.UI) {
			throw new Error(
				`EndFrame called with renderType = ${this.renderType}, expected RenderType.UI.`
			)
		}

		this.flush()
		this.spriteRenderer.setAntialiasingPixelsPerTexel(0)
	}

	grabWindowMouseFocus() {
		// TODO: Is this useful?
		// this.window.grabWindowMouseFocus()
	}

	releaseWindowMouseFocus() {
		// TODO: Is this useful?
		// this.window.releaseWindowMouseFocus()
	}

	saveScreenshot(path: string) {
		//  Pull the data from the Texture directly to prevent the sheet from buffering it
		const src = this.screenBuffer.texture.getData()
		const srcWidth = this.screenSprite.Sheet.Size.Width
		const destWidth = this.screenSprite.Bounds.Width
		const destHeight = this.screenSprite.Bounds.Height * -1
		const channelOrder = [2, 1, 0, 3]

		//  Convert BGRA to RGBA
		const dest = new Uint8ClampedArray(4 * (destWidth * destHeight))

		for (let y = 0; y < destHeight; y++) {
			for (let x = 0; x < destWidth; x++) {
				const destOffset = 4 * (y * destWidth + x)
				const srcOffset = 4 * (y * srcWidth + x)

				for (let i = 0; i < 4; i++) {
					dest[destOffset + i] = src[srcOffset + channelOrder[i]]
				}
			}
		}

		// TODO: Save image
		// (new Png(dest, destWidth, destHeight)).save(path)
		throw new Error('Not implemented yet')
	}

	getClipboardText(): string {
		return this.window.getClipboardText()
	}

	setClipboardText(text: string): boolean {
		return this.window.setClipboardText(text)
	}

	get glVersion(): string {
		return this.context.glVersion
	}

	createFont(name: string): FontRenderer {
		return this.platform.createFont(name)
	}
}
