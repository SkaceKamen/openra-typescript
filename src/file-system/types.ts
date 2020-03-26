import { DataStream } from '../utils/stream'

export interface PackageLoader {
	tryParsePackage(
		s: DataStream,
		filename: string,
		context: ReadOnlyFileSystem
	): Promise<ReadOnlyPackage | null>
}

export interface ReadOnlyPackage {
	name: string | undefined

	contents: string[]

	getStream(filename: string): Promise<DataStream | null>

	contains(filename: string): boolean

	openPackage(
		filename: string,
		context: ReadOnlyFileSystem
	): Promise<ReadOnlyPackage | null>
}

export interface ReadWritePackage extends ReadOnlyPackage {
	update(filename: string, contents: DataStream): Promise<void>
	delete(filename: string): Promise<void>
}

export interface ReadWritePackage extends ReadOnlyPackage {
	update(filename: string, contents: DataStream): void

	delete(filename: string): void
}

export interface ReadOnlyFileSystem {
	open(filename: string): Promise<DataStream>

	tryGetPackageContaining(
		path: string
	): {
		pkg: ReadOnlyPackage
		filename: string
	} | null

	tryOpen(filename: string): Promise<DataStream | null>

	exists(filename: string): boolean

	isExternalModFile(filename: string): boolean
}
