export interface PackageLoader {
	tryParsePackage(
		s: DataView,
		filename: string,
		context: ReadOnlyFileSystem
	): Promise<ReadOnlyPackage | null>
}

export interface ReadOnlyPackage {
	name: string | undefined

	contents: string[]

	getStream(filename: string): Promise<DataView | null>

	contains(filename: string): boolean

	openPackage(
		filename: string,
		context: ReadOnlyFileSystem
	): Promise<ReadOnlyPackage | null>
}

export interface ReadWritePackage extends ReadOnlyPackage {
	update(filename: string, contents: ArrayBuffer): Promise<void>
	delete(filename: string): Promise<void>
}

export interface ReadWritePackage extends ReadOnlyPackage {
	update(filename: string, contents: ArrayBuffer): void

	delete(filename: string): void
}

export interface ReadOnlyFileSystem {
	open(filename: string): Promise<DataView>

	tryGetPackageContaining(
		path: string
	): {
		pkg: ReadOnlyPackage
		filename: string
	} | null

	tryOpen(filename: string): Promise<DataView | null>

	exists(filename: string): boolean

	isExternalModFile(filename: string): boolean
}
