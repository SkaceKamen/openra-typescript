export class RemoteFile {
	static async read(filename: string) {
		return fetch(`static/${filename}`).then(r => r.arrayBuffer())
	}
}
