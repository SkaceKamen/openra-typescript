import { Logger } from './log'
import { Renderer } from './renderer'
import { BrowserPlatform } from './platform/browser'

export class Game {
	static renderer: Renderer

	static start() {
		this.renderer = new Renderer(new BrowserPlatform(), null)

		Logger.info('Game starting...')
	}
}
