import { Game } from './game'
import { RemoteFileSystem } from './file-system/remote'

async function start() {
	await RemoteFileSystem.load('assets.zip')
	await RemoteFileSystem.load('content.zip')

	Game.start()
}

start()
