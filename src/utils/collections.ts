export const makeArray = <T>(length: number, cb: (i: number) => T) => {
	const result = []

	for (let i = 0; i < length; i++) {
		result[i] = cb(i)
	}

	return result
}
