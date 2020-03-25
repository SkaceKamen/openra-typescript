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
