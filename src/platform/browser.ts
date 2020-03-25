import { WebRenderingContext } from '../browser/rendering-context'
import { FontRenderer } from '../browser/font-renderer'
import { BrowserWindow } from '../browser/window'

export class BrowserPlatform {
	canvas: HTMLCanvasElement | undefined

	createWindow() {
		return new BrowserWindow()
	}

	createContext() {
		return new WebRenderingContext(this.canvas as HTMLCanvasElement)
	}

	createFont(name = 'Consolas') {
		return new FontRenderer(name)
	}
}
