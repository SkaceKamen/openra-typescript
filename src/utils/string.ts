/**
 * Returns if string is ending with ending, ignoring case per default
 * @param str
 * @param ending
 * @param ignoreCase
 */
export const endsWith = (str: string, ending: string, ignoreCase = true) =>
	(ignoreCase ? str.toLowerCase() : str).indexOf(
		ignoreCase ? ending.toLowerCase() : ending
	) ===
	str.length - ending.length

export const isNullOrWhiteSpace = (str: string | null) =>
	str === null || str.match(/^\s+$/)

export const ucFirst = (str: string) =>
	str.substr(0, 1).toUpperCase() + str.substr(1)
