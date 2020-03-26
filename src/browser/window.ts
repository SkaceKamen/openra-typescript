import { WebRenderingContext } from './rendering-context'
import { MyEvent } from '../utils/events'
import { Size, Vector2 } from '../utils/math'
import {
	InputHandler,
	MouseInput,
	KeyInput,
	MouseButton,
	MouseInputEvent,
	Modifiers,
	KeyInputEvent
} from '../input/input-handler'
import { Key } from 'ts-key-enum'

export type WindowScaleChangedEvent = {
	old: number
	new: number
}

const whichToButton = {
	0: MouseButton.Left,
	1: MouseButton.Middle,
	2: MouseButton.Right
} as const

const eventToModifier = (e: MouseEvent | KeyboardEvent) => {
	return e.ctrlKey
		? Modifiers.Ctrl
		: e.altKey
		? Modifiers.Alt
		: e.shiftKey
		? Modifiers.Shift
		: Modifiers.None
}

export class BrowserWindow {
	canvas: HTMLCanvasElement
	context: WebRenderingContext

	windowSize: Size
	surfaceSize: Size
	windowScale = 1
	scaleModifier = 1

	onWindowScaleChanged = new MyEvent<WindowScaleChangedEvent>()

	mouseEvents: MouseInput[] = []
	keyEvents: KeyInput[] = []

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

		//TODO: Tons of duplicate code here

		window.addEventListener('mousemove', e => {
			this.mouseEvents.push({
				event: MouseInputEvent.Move,
				button: MouseButton.None,
				delta: new Vector2(e.movementX, e.movementY),
				location: this.mousePosition(e),
				modifiers: eventToModifier(e),
				multiTapCount: 0
			})
		})

		window.addEventListener('mouseup', e => {
			this.mouseEvents.push({
				event: MouseInputEvent.Up,
				button: whichToButton[e.button as 0 | 1 | 2],
				delta: new Vector2(e.movementX, e.movementY),
				location: this.mousePosition(e),
				modifiers: eventToModifier(e),
				multiTapCount: 0
			})
		})

		window.addEventListener('mousedown', e => {
			this.mouseEvents.push({
				event: MouseInputEvent.Down,
				button: whichToButton[e.button as 0 | 1 | 2],
				delta: new Vector2(e.movementX, e.movementY),
				location: this.mousePosition(e),
				modifiers: eventToModifier(e),
				multiTapCount: 0
			})
		})

		window.addEventListener('keydown', e => {
			this.keyEvents.push({
				event: KeyInputEvent.Down,
				isRepeat: false,
				key: e.key as Key,
				modifiers: eventToModifier(e),
				multiTapCount: 0,
				unicodeChar: e.key
			})
		})

		window.addEventListener('keyup', e => {
			this.keyEvents.push({
				event: KeyInputEvent.Up,
				isRepeat: false,
				key: e.key as Key,
				modifiers: eventToModifier(e),
				multiTapCount: 0,
				unicodeChar: e.key
			})
		})
	}

	private mousePosition(e: MouseEvent) {
		const canvasOffsetLeft = this.canvas.offsetLeft
		const canvasOffsetTop = this.canvas.offsetTop

		return new Vector2(
			e.clientX - canvasOffsetLeft,
			e.clientY - canvasOffsetTop
		)
	}

	getClipboardText(): string {
		throw new Error('Not implemented')
	}

	setClipboardText(data: string): boolean {
		throw new Error('Not implemented')
	}

	pumpInput(inputHandler: InputHandler) {
		this.mouseEvents.forEach(e => inputHandler.onMouseInput(e))
		this.keyEvents.forEach(e => inputHandler.onKeyInput(e))
	}
}
