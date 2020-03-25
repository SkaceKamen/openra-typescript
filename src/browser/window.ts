import { WebRenderingContext } from './rendering-context'
import { MyEvent } from '../utils/events'
import { Size } from '../utils/math'

export type WindowScaleChangedEvent = {
	old: number
	new: number
}

export class BrowserWindow {
	canvas: HTMLCanvasElement
	context: WebRenderingContext

	windowSize: Size
	surfaceSize: Size
	windowScale = 1
	scaleModifier = 1

	onWindowScaleChanged = new MyEvent<WindowScaleChangedEvent>()

	get effectiveWindowSize() {
		return new Size(
			this.windowSize.width / this.scaleModifier,
			this.windowSize.height / this.scaleModifier
		)
	}

	get effectiveWindowScale() {
		return this.windowScale * this.scaleModifier
	}

	constructor() {
		const container = document.body

		const vw = Math.max(
			document.documentElement.clientWidth,
			window.innerWidth || 0
		)

		const vh = Math.max(
			document.documentElement.clientHeight,
			window.innerHeight || 0
		)

		this.windowSize = new Size(vw, vh)
		this.surfaceSize = this.windowSize

		this.canvas = document.createElement('canvas')
		this.canvas.width = this.windowSize.width
		this.canvas.height = this.windowSize.height

		container.appendChild(this.canvas)

		this.context = new WebRenderingContext(this.canvas)
	}

	getClipboardText(): string {
		throw new Error('Not implemented')
	}

	setClipboardText(data: string): boolean {
		throw new Error('Not implemented')
	}

	pumpInput(inputHandler: InputHandler) {}
}
