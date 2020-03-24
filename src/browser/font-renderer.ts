import { Size } from '../utils/types'
import { Vector2 } from '../utils/math'

export interface FontGlyph {
	offset: Vector2
	size: Size
	advance: number
	data: Uint8ClampedArray
}

export class FontRenderer {
	font: string
	canvas: HTMLCanvasElement | undefined

	constructor(font: string) {
		this.font = font
	}

	createGlyph(c: string, size: number, deviceScale: number) {
		const scaledSize = size * deviceScale
		const data = this.canvasDraw(c, scaledSize)
		const width = Math.round(scaledSize / 2)

		const g = {
			advance: width,
			offset: new Vector2(0, -scaledSize),
			size: new Size(width, scaledSize),
			data: data
		}

		return g
	}

	canvasDraw(c: string, size: number) {
		const width = Math.round(size / 2)
		const height = size

		if (!this.canvas) {
			this.canvas = document.createElement('canvas')
		}

		this.canvas.width = width
		this.canvas.height = height

		const context = this.canvas.getContext('2d') as CanvasRenderingContext2D

		context.textBaseline = 'top'
		context.font = size + 'px ' + this.font
		context.fillText(c, 0, 0)

		// We only care about the alpha values, discard the rest
		const im = context.getImageData(0, 0, width, height)
		const data = new Uint8ClampedArray(width * height)

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				data[y * width + x] = im.data[(y * width + x) * 4 + 3]
			}
		}

		return data
	}
}
