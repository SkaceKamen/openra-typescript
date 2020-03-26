import { RecordCache } from './cache'

type BitSetIndex = number

class BitSetAllocator {
	static bits: RecordCache<string, BitSetIndex> = new RecordCache<
		string,
		BitSetIndex
	>(BitSetAllocator.allocate)

	static nextBits: BitSetIndex = 1

	static allocate(): BitSetIndex {
		const bits = this.nextBits
		this.nextBits <<= 1

		return bits
	}

	static getBits(values: string[]): BitSetIndex {
		let bits: BitSetIndex = 0

		for (const value of values) {
			bits |= this.bits.get(value)
		}

		return bits
	}

	static getBitsNoAlloc(values: string[]): BitSetIndex {
		let bits: BitSetIndex = 0

		for (const value of values) {
			if (this.bits.containsKey(value)) {
				bits = bits | this.bits.get(value)
			}
		}

		return bits
	}

	static getStrings(bits: BitSetIndex): string[] {
		const values: string[] = []

		for (const kvp of this.bits.entries()) {
			if ((kvp[1] & bits) != 0) {
				values.push(kvp[0])
			}
		}

		return values
	}

	static bitsContainString(bits: BitSetIndex, value: string): boolean {
		if (!this.bits.containsKey(value)) {
			return false
		}

		return (bits & this.bits.get(value)) != 0
	}
}

export class BitSet<T> {
	static fromValues<T>(values: string[]) {
		return new BitSet<T>(BitSetAllocator.getBits(values))
	}

	bits: BitSetIndex

	constructor(bits: BitSetIndex) {
		this.bits = bits
	}

	static fromStringsNoAlloc<T>(values: string[]): BitSet<T> {
		return new BitSet<T>(BitSetAllocator.getBitsNoAlloc(values))
	}

	toString(): string {
		return BitSetAllocator.getStrings(this.bits).join(',')
	}

	static equals<T>(me: BitSet<T>, other: BitSet<T>): boolean {
		return me.bits == other.bits
	}

	getHashCode(): number {
		return this.bits
	}

	get isEmpty(): boolean {
		return this.bits == 0
	}

	isProperSubsetOf(other: BitSet<T>): boolean {
		return this.isSubsetOf(other) && !this.setEquals(other)
	}

	isProperSupersetOf(other: BitSet<T>): boolean {
		return this.isSupersetOf(other) && !this.setEquals(other)
	}

	isSubsetOf(other: BitSet<T>): boolean {
		return (this.bits | other.bits) == other.bits
	}

	isSupersetOf(other: BitSet<T>): boolean {
		return (this.bits | other.bits) == this.bits
	}

	overlaps(other: BitSet<T>): boolean {
		return (this.bits & other.bits) != 0
	}

	setEquals(other: BitSet<T>): boolean {
		return this.bits == other.bits
	}

	contains(value: string): boolean {
		return BitSetAllocator.bitsContainString(this.bits, value)
	}

	getEnumerator(): string[] {
		return BitSetAllocator.getStrings(this.bits)
	}

	except(other: BitSet<T>): BitSet<T> {
		return new BitSet<T>(this.bits & ~other.bits)
	}

	intersect(other: BitSet<T>): BitSet<T> {
		return new BitSet<T>(this.bits & other.bits)
	}

	symmetricExcept(other: BitSet<T>): BitSet<T> {
		return new BitSet<T>(this.bits ^ other.bits)
	}

	union(other: BitSet<T>): BitSet<T> {
		return new BitSet<T>(this.bits | other.bits)
	}
}
