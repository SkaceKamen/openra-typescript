export const tryParseInt = (v: string | null, radix = 10) => {
	if (v === null) {
		throw new Error('Trying to parse null as int')
	}

	const r = parseInt(v, radix)
	if (r === Number.NaN) {
		throw new Error(`${v} is not an integer`)
	}

	return r
}

export const tryParseFloat = (v: string | null) => {
	if (v === null) {
		throw new Error('Trying to parse null as float')
	}

	const r = parseFloat(v)
	if (r === Number.NaN) {
		throw new Error(`${v} is not a float`)
	}

	return r
}
