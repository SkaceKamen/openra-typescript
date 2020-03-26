export class RecordCache<T extends string | number | symbol, U> {
	cache: Record<T, U>
	length = 0

	loader: (i: T) => U

	constructor(loader: (i: T) => U) {
		this.loader = loader
		this.cache = {} as Record<T, U>
	}

	get(key: T): U {
		if (this.cache[key] === undefined) {
			return (this.cache[key] = this.loader(key))
		}

		return this.cache[key]
	}

	containsKey(key: T): boolean {
		return this.cache[key] !== undefined
	}

	clear() {
		this.cache = {} as Record<T, U>
	}

	get keys() {
		return Object.keys(this.cache) as T[]
	}

	get values() {
		return Object.values(this.cache) as U[]
	}

	entries() {
		return Object.entries(this.cache) as [T, U][]
	}
}

export class AsyncRecordCache<T extends string | number | symbol, U> {
	cache: Record<T, U>
	length = 0

	loader: (i: T) => U | Promise<U>

	constructor(loader: (i: T) => U | Promise<U>) {
		this.loader = loader
		this.cache = {} as Record<T, U>
	}

	async get(key: T): Promise<U> {
		if (this.cache[key] === undefined) {
			return (this.cache[key] = await this.loader(key))
		}

		return this.cache[key]
	}

	containsKey(key: T): boolean {
		return this.cache[key] !== undefined
	}

	clear() {
		this.cache = {} as Record<T, U>
	}

	get keys() {
		return Object.keys(this.cache) as T[]
	}

	get values() {
		return Object.values(this.cache) as U[]
	}

	entries() {
		return Object.entries(this.cache) as [T, U][]
	}
}
