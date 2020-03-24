import JSZip from 'jszip'
import { Logger } from '../log'

function normalizePath(path: string) {
	if (path.indexOf('./') === 0) {
		path = path.substr(2)
	}

	if (path.length > 0 && path.substr(path.length - 1) === '/') {
		path = path.substr(0, path.length - 1)
	}

	return path
}

export class RemoteFileSystem {
	private static data: Record<string, ArrayBuffer> = {}

	static async load(path: string) {
		const r = await fetch(path)
		const d = await r.arrayBuffer()
		const zip = await JSZip.loadAsync(d)
		const entries = Object.keys(zip.files).map(name => zip.files[name])

		const allFiles = await Promise.all(
			entries.map(entry =>
				entry.async('uint8array').then(u8 => [entry.name, u8] as const)
			)
		)

		Logger.debug(`Loaded ${allFiles.length} files from ${path}`)

		this.data = allFiles.reduce((acc, [name, contents]) => {
			acc[name] = contents

			return acc
		}, this.data)
	}

	static directoryExists(filename: string) {
		const path = normalizePath(filename)

		if (path === '' || path === '.') {
			return true
		}

		const res = this.data[path + '/'] !== undefined

		return res
	}

	static fileExists(filename: string) {
		const path = normalizePath(filename)

		if (path === '' || path === '.') {
			return true
		}

		const res =
			this.data[path] !== undefined ||
			this.data[path.replace(/\/$/, '')] !== undefined ||
			this.data[path + '/'] !== undefined

		return res
	}

	static exists(filename: string) {
		return this.directoryExists(filename) || this.fileExists(filename)
	}

	static read(filename: string) {
		const path = normalizePath(filename)

		if (!this.data[path]) {
			throw new Error(`File ${filename} (normalized as ${path}) doesn't exist!`)
		}

		return this.data[path]
	}

	static files(filename: string) {
		const path = normalizePath(filename)
		const matcher = new RegExp('^' + path.replace(/\//g, '\\/') + '\\/[^\\/]+$')

		return Object.entries(this.data)
			.filter(([file]) => {
				return matcher.test(file)
			})
			.map(([file]) => file)
	}

	static directories(filename: string) {
		const path = normalizePath(filename)
		const matcher = new RegExp('^' + path + '/[^/]*/$')

		return Object.entries(this.data)
			.filter(([file, contents]) => {
				return matcher.test(file) && contents.byteLength === 0
			})
			.map(([file]) => file.substr(0, file.length - 1))
	}
}
