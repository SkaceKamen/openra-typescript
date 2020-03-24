import { ReadOnlyFileSystem, ReadOnlyPackage, PackageLoader } from './types'
import { Platform } from '../platform'
import { ZipFileLoader } from './zip-file'
import { Manifest } from '../manifest'
import { Folder } from './folder'
import { RemoteFileSystem } from './remote'

export class FileSystem implements ReadOnlyFileSystem {
	mountedPackages: {
		pkg: ReadOnlyPackage
		mountCount: number
	}[] = []

	explicitMounts: Record<string, ReadOnlyPackage> = {}

	modID: string

	//  Mod packages that should not be disposed
	modPackages: ReadOnlyPackage[] = []

	installedMods: Record<string, Manifest>

	packageLoaders: PackageLoader[]

	fileIndex: Record<string, ReadOnlyPackage[]> = {}

	constructor(
		modID: string,
		installedMods: Record<string, Manifest>,
		packageLoaders: PackageLoader[]
	) {
		this.modID = modID
		this.installedMods = installedMods
		this.packageLoaders = [...packageLoaders, new ZipFileLoader()]
	}

	async tryParsePackage(stream: DataView, filename: string) {
		for (const packageLoader of this.packageLoaders) {
			const pkg = await packageLoader.tryParsePackage(stream, filename, this)

			if (pkg !== null) {
				return pkg
			}
		}

		return null
	}

	async openPackage(filename: string) {
		//  Raw directories are the easiest and one of the most common cases, so try these first
		let resolvedPath = Platform.resolvePath(filename)

		if (resolvedPath.indexOf('/') === 0) {
			resolvedPath = resolvedPath.substring(1)
		}

		if (
			filename.indexOf('|') < 0 &&
			RemoteFileSystem.directoryExists(resolvedPath)
		) {
			return new Folder(resolvedPath)
		}

		//  Children of another package require special handling
		const opened = this.tryGetPackageContaining(filename)

		if (opened) {
			return opened.pkg.openPackage(opened.filename, this)
		}

		//  Try and open it normally
		let pkg: ReadOnlyPackage | null
		const stream = await this.open(filename)

		if ((pkg = await this.tryParsePackage(stream, filename))) {
			console.log('Parsed ' + (filename + ' as package'))

			return pkg
		}

		return null
	}

	async mount(
		name: ReadOnlyPackage | string,
		explicitName: string | null = null
	) {
		if (typeof name === 'string') {
			const optional = name.indexOf('~') === 0

			if (optional) {
				name = name.substring(1)
			}

			try {
				let pkg: ReadOnlyPackage | null

				if (name.indexOf('$') === 0) {
					name = name.substring(1)
					let mod: Manifest

					if (!(mod = this.installedMods[name])) {
						throw new Error(
							`Could not load mod '${name}'. Available mods: ${Object.keys(
								this.installedMods
							).join(', ')}`
						)
					}

					pkg = mod.package
					this.modPackages.push(pkg)
				} else {
					pkg = await this.openPackage(name)

					if (pkg === null) {
						throw new Error(
							`Could not open package '${name}', file not found or its format is not supported."`
						)
					}
				}

				if (pkg !== null) {
					await this.mount(pkg, explicitName)
				}
			} catch (e) {
				if (!optional) {
					throw e
				}
			}
		} else {
			const found = this.mountedPackages.find(i => i.pkg === name)

			if (found) {
				//  Package is already mounted
				//  Increment the mount count and bump up the file loading priority
				found.mountCount += 1

				for (const filename of found.pkg.contents) {
					this.fileIndex[filename] = [
						...(this.fileIndex[filename].filter(i => i !== name) || []),
						name
					]
				}
			} else {
				//  Mounting the package for the first time
				this.mountedPackages.push({
					pkg: name,
					mountCount: 1
				})

				if (explicitName != null) {
					this.explicitMounts[explicitName] = name
				}

				for (const filename in name.contents) {
					this.fileIndex[filename].push(name)
				}
			}
		}
	}

	unmount(pkg: ReadOnlyPackage): boolean {
		const found = this.mountedPackages.find(i => i.pkg === pkg)

		if (!found) {
			return false
		}

		if (--found.mountCount <= 0) {
			for (const packagesForFile of Object.values(this.fileIndex)) {
				packagesForFile.filter(p => p != pkg)
			}

			this.mountedPackages = this.mountedPackages.filter(i => i.pkg === pkg)

			const explicitKeys = Object.entries(this.explicitMounts)
				.filter(kv => kv[1] == pkg)
				.map(kv => kv[0])

			for (const key of explicitKeys) {
				delete this.explicitMounts[key]
			}

			this.modPackages = this.modPackages.filter(p => p !== pkg)
		}

		return true
	}

	unmountAll() {
		this.mountedPackages = []
		this.explicitMounts = {}
		this.modPackages = []

		this.fileIndex = {}
	}

	loadFromManifest(manifest: Manifest) {
		this.unmountAll()

		Object.entries(manifest.packages).forEach(([key, value]) => {
			this.mount(key, value)
		})
	}

	async getFromCache(filename: string) {
		const pkg = this.fileIndex[filename].find(x => x.contains(filename))

		if (pkg != null) {
			return pkg.getStream(filename)
		}

		return null
	}

	async open(filename: string) {
		let s: DataView | null

		if (!(s = await this.tryOpen(filename))) {
			throw new Error(`File not found: ${filename}`)
		}

		return s
	}

	tryGetPackageContaining(path: string) {
		const explicitSplit = path.indexOf('|')
		let pkg = null

		if (
			explicitSplit > 0 &&
			(pkg = this.explicitMounts[path.substring(0, explicitSplit)])
		) {
			return {
				filename: path.substring(explicitSplit + 1),
				pkg
			}
		}

		pkg = this.fileIndex[path].find(x => x.contains(path))

		if (pkg) {
			return {
				pkg,
				filename: path
			}
		}

		return null
	}

	async tryOpen(filename: string) {
		const explicitSplit = filename.indexOf('|')

		if (explicitSplit > 0) {
			let explicitPackage: ReadOnlyPackage

			if (
				(explicitPackage = this.explicitMounts[
					filename.substring(0, explicitSplit)
				])
			) {
				const s = await explicitPackage.getStream(
					filename.substring(explicitSplit + 1)
				)

				if (s != null) {
					return s
				}
			}
		}

		const s = this.getFromCache(filename)

		if (s != null) {
			return s
		}

		//  The file should be in an explicit package (but we couldn't find it)
		//  Thus don't try to find it using the filename (which contains the invalid '|' char)
		//  This can be removed once the TODO below is resolved
		if (explicitSplit > 0) {
			return null
		}

		//  Ask each package individually
		//  TODO: This fallback can be removed once the filesystem cleanups are complete
		const item = this.mountedPackages.find(x => x.pkg.contains(filename))

		if (item != null) {
			return item.pkg.getStream(filename)
		}

		return null
	}

	exists(filename: string): boolean {
		const explicitSplit = filename.indexOf('|')

		if (explicitSplit > 0) {
			let explicitPackage: ReadOnlyPackage

			if (
				(explicitPackage = this.explicitMounts[
					filename.substring(0, explicitSplit)
				])
			) {
				if (explicitPackage.contains(filename.substring(explicitSplit + 1))) {
					return true
				}
			}
		}

		return this.fileIndex[filename] !== undefined
	}

	///  <summary>
	///  Returns true if the given filename references an external mod via an explicit mount
	///  </summary>
	isExternalModFile(filename: string): boolean {
		const explicitSplit = filename.indexOf('|')

		if (explicitSplit < 0) {
			return false
		}

		let explicitPackage: ReadOnlyPackage

		if (
			!(explicitPackage = this.explicitMounts[
				filename.substring(0, explicitSplit)
			])
		) {
			return false
		}

		if (this.installedMods[this.modID].package == explicitPackage) {
			return false
		}

		return this.modPackages.includes(explicitPackage)
	}

	getPrefix(pkg: ReadOnlyPackage) {
		return (Object.entries(this.explicitMounts).find(kv => kv[1] === pkg) ||
			[])[0]
	}
}
