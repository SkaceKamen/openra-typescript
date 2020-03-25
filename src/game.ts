import { Logger } from './log'
import { Renderer } from './renderer'

export class Game {
	static renderer: Renderer

	static start() {
		Logger.info('Game starting...')
	}
}
