import { ReadOnlyPackage, PackageLoader, ReadWritePackage } from './types'
import JSZip from 'jszip'
import { FileSystem } from './file-system'
import { RemoteFile } from './file'
import { endsWith } from '../utils/string'

class ReadOnlyZipFile implements ReadOnlyPackage {
	static async create(s: DataView | null, filename: string) {
		return new ReadOnlyZipFile(
			s ? await JSZip.loadAsync(s.buffer) : new JSZip(),
			filename
		)
	}

	name: string

	protected pkg: JSZip

	constructor(zip: JSZip, filename: string) {
		this.name = filename
		this.pkg = zip
	}

	async getStream(filename: string) {
		const entry = this.pkg?.file(filename)

		if (!entry) {
			return null
		}

		return new DataView(await entry.async('arraybuffer'))
	}

	get contents(): string[] {
		return Object.values(this.pkg?.files).map(v => v.name)
	}

	contains(filename: string): boolean {
		return !!this.pkg.file(filename)
	}

	async openPackage(
		filename: string,
		context: FileSystem
	): Promise<null | ReadOnlyPackage> {
		//  Directories are stored with a trailing "/" in the index
		const entry = this.pkg.file(filename) || this.pkg.file(filename + '/')

		if (!entry) {
			return null
		}

		if (entry.dir) {
			return new ZipFolder(this, filename)
		}

		// Other package types can be loaded normally
		const s = await this.getStream(filename)

		if (!s) {
			return null
		}

		let pkg: ReadOnlyPackage | null

		if ((pkg = await context.tryParsePackage(s, filename))) {
			return pkg
		}

		return null
	}
}

/*
class ReadWriteZipFile extends ReadOnlyZipFile implements ReadWritePackage {
	static async createWritable(filename: string, create = false) {
		return new ReadWriteZipFile(
			!create
				? await JSZip.loadAsync(await RemoteFile.read(filename))
				: new JSZip(),
			filename
		)
	}

	async commit() {
		RemoteFile.write(
			this.name,
			await this.pkg.generateAsync({ type: 'arraybuffer' })
		)
	}

	async update(filename: string, contents: ArrayBuffer) {
		this.pkg.file(filename, contents)
		await this.commit()
	}

	async delete(filename: string) {
		this.pkg.remove(filename)
		await this.commit()
	}
}
*/

class ZipFolder implements ReadOnlyPackage {
	name: string

	parent: ReadOnlyZipFile

	private path: string

	constructor(parent: ReadOnlyZipFile, path: string) {
		if (path.indexOf('/') === path.length - 1) {
			path = path.substring(0, path.length - 1)
		}

		this.parent = parent
		this.path = path
		this.name = path
	}

	getStream(filename: string) {
		//  Zip files use '/' as a path separator
		return this.parent.getStream(this.path + '/' + filename)
	}

	get contents() {
		return this.parent.contents.filter(entry => {
			if (entry.indexOf(this.path) === 0 && entry !== this.path) {
				const filename = entry.substring(this.path.length + 1)
				const dirLevels = filename.split('/').filter(i => i.length > 0).length

				return dirLevels === 1
			}
		})
	}

	contains(filename: string) {
		return this.parent.contains(this.path + ('/' + filename))
	}

	openPackage(filename: string, context: FileSystem) {
		return this.parent.openPackage(this.path + ('/' + filename), context)
	}
}

export class ZipFileLoader implements PackageLoader {
	static extensions = ['.zip', '.oramap']

	async tryParsePackage(s: DataView, filename: string) {
		if (!ZipFileLoader.extensions.find(e => endsWith(filename, e))) {
			return null
		}

		return ReadOnlyZipFile.create(s, filename)
	}

	/*
	static async tryParseReadWritePackage(filename: string) {
		if (!ZipFileLoader.extensions.find(e => endsWith(filename, e))) {
			return null
		}

		return ReadWriteZipFile.createWritable(filename)
	}

	static create(filename: string) {
		return ReadWriteZipFile.createWritable(filename, true)
	}
	*/
}
