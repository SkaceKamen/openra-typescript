export function ab2str(buf: ArrayBuffer) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return String.fromCharCode.apply(null, new Uint16Array(buf) as any)
}
