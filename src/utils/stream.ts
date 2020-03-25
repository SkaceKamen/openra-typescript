export class DataStream {
	position = 0

	view: DataView

	get buffer() {
		return this.view.buffer
	}

	constructor(view: DataView) {
		this.view = view
	}

	seek(offset: number) {
		this.position = offset
	}

	getBigInt64() {
		const result = this.view.getBigInt64(this.position)
		this.position += 8

		return result
	}
	getBigUint64() {
		const result = this.view.getBigUint64(this.position)
		this.position += 8

		return result
	}
	getFloat32() {
		const result = this.view.getFloat32(this.position)
		this.position += 4

		return result
	}
	getFloat64() {
		const result = this.view.getFloat64(this.position)
		this.position += 8

		return result
	}
	getInt16() {
		const result = this.view.getInt16(this.position)
		this.position += 2

		return result
	}
	getInt32() {
		const result = this.view.getInt32(this.position)
		this.position += 4

		return result
	}
	getInt8() {
		const result = this.view.getInt8(this.position)
		this.position += 1

		return result
	}
	getUint16() {
		const result = this.view.getUint16(this.position)
		this.position += 2

		return result
	}
	getUint32() {
		const result = this.view.getUint32(this.position)
		this.position += 4

		return result
	}
	getUint8() {
		const result = this.view.getUint8(this.position)
		this.position += 1

		return result
	}

	putBigInt64() {
		this.view.getBigInt64(this.position)
		this.position += 8
	}
	putBigUint64() {
		this.view.getBigUint64(this.position)
		this.position += 8
	}
	putFloat32() {
		this.view.getFloat32(this.position)
		this.position += 4
	}
	putFloat64() {
		this.view.getFloat64(this.position)
		this.position += 8
	}
	putInt16() {
		this.view.getInt16(this.position)
		this.position += 2
	}
	putInt32() {
		this.view.getInt32(this.position)
		this.position += 4
	}
	putInt8() {
		this.view.getInt8(this.position)
		this.position += 1
	}
	putUint16() {
		this.view.getUint16(this.position)
		this.position += 2
	}
	putUint32() {
		this.view.getUint32(this.position)
		this.position += 4
	}
	putUint8() {
		this.view.getUint8(this.position)
		this.position += 1
	}
}
