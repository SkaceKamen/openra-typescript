export const endsWith = (str: string, ending: string, ignoreCase = true) =>
	(ignoreCase ? str.toLowerCase() : str).indexOf(
		ignoreCase ? ending.toLowerCase() : ending
	) ===
	str.length - ending.length
