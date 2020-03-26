export const makeArray = <T>(length: number, cb: (i: number) => T) => {
	const result = []

	for (let i = 0; i < length; i++) {
		result[i] = cb(i)
	}

	return result
}

export const range = (start: number, length: number) => {
	const result = []

	for (let i = start; i < start + length; i++) {
		result.push(i)
	}

	return result
}
