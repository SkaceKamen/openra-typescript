import { WebRenderingContext } from '../browser/rendering-context'
import { FontRenderer } from '../browser/font-renderer'

export class BrowserPlarform {
	canvas: HTMLCanvasElement | undefined

	initialize() {
		const container = document.body

		this.canvas = document.createElement('canvas')
		this.canvas.width = container.clientWidth
		this.canvas.height = container.clientHeight

		container.appendChild(this.canvas)
	}

	createContext() {
		return new WebRenderingContext(this.canvas as HTMLCanvasElement)
	}

	createFont(name = 'Consolas') {
		return new FontRenderer(name)
	}
}
