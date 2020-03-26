import { ReadOnlyPackage } from './types'
import { RemoteFile } from './file'
import { Platform } from '../platform'
import { FileSystem } from './file-system'
import { RemoteFileSystem } from './remote'
import { DataStream } from '../utils/stream'

export class Folder implements ReadOnlyPackage {
	name: string
	path: string

	constructor(path: string) {
		this.path = path
		this.name = path
	}

	get contents() {
		return [
			...RemoteFileSystem.files(this.path),
			...RemoteFileSystem.directories(this.path)
		]
	}

	async getStream(filename: string) {
		try {
			return new DataStream(await RemoteFile.read(this.path + '/' + filename))
		} catch (e) {
			return null
		}
	}

	contains(filename: string): boolean {
		const combined = this.path + '/' + filename

		return (
			combined.indexOf(this.path) === 0 && RemoteFileSystem.exists(combined)
		)
	}

	async openPackage(
		filename: string,
		context: FileSystem
	): Promise<ReadOnlyPackage | null> {
		const resolvedPath = Platform.resolvePath(this.name + '/' + filename)

		if (RemoteFileSystem.directoryExists(resolvedPath)) {
			return new Folder(resolvedPath)
		}

		/*
		//  Zip files loaded from Folders (and *only* from Folders) can be read-write
		let readWritePackage: ReadWritePackage | null = null

		if (
			(readWritePackage = await ZipFileLoader.tryParseReadWritePackage(
				resolvedPath
			))
		) {
			return readWritePackage
    }
    */

		//  Other package types can be loaded normally
		let pkg: ReadOnlyPackage | null
		const s = await this.getStream(filename)

		if (s == null) {
			return null
		}

		if ((pkg = await context.tryParsePackage(s, filename))) {
			return pkg
		}

		return null
	}
}
