/* eslint-disable @typescript-eslint/no-explicit-any */

export class Logger {
	static debug(...data: any[]) {
		console.log(...data)
	}

	static verbose(...data: any[]) {
		console.log(...data)
	}

	static info(...data: any[]) {
		console.info(...data)
	}

	static warn(...data: any[]) {
		console.warn(...data)
	}

	static trace(...data: any[]) {
		console.trace(...data)
	}

	static group(...data: any[]) {
		console.group(...data)
	}

	static groupCollapsed(...data: any[]) {
		console.groupCollapsed(...data)
	}

	static groupEnd() {
		console.groupEnd()
	}
}
