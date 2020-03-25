import { VertexArray } from '../browser/vertex-array'
import { Vector3, Vector2 } from '../utils/math'
import { Sprite, TextureChannel, SpriteWithSecondaryData } from './sprite'
import { Color } from '../utils/color'
import PNG from 'upng-js'
import { makeArray } from '../utils/collections'
import { Int32Matrix4x4 } from '../utils/matrix'

export class Util {
	//  yes, our channel order is nuts.
	static ChannelMasks = [2, 1, 0, 3] as const

	static fastCreateQuad(
		vertices: VertexArray,
		o: Vector3,
		r: Sprite,
		samplers: Vector2,
		paletteTextureIndex: number,
		nv: number,
		size: Vector3
	) {
		const b = new Vector3(o.x + size.x, o.y, o.z)
		const c = new Vector3(o.x + size.x, o.y + size.y, o.z + size.z)
		const d = new Vector3(o.x, o.y + size.y, o.z + size.z)

		Util.fastCreateQuad2(
			vertices,
			o,
			b,
			c,
			d,
			r,
			samplers,
			paletteTextureIndex,
			nv
		)
	}

	static fastCreateQuad2(
		vertices: VertexArray,
		a: Vector3,
		b: Vector3,
		c: Vector3,
		d: Vector3,
		r: Sprite,
		samplers: Vector2,
		paletteTextureIndex: number,
		nv: number
	) {
		let sl = 0
		let st = 0
		let sr = 0
		let sb = 0
		//  See shp.vert for documentation on the channel attribute format
		let attribC =
			r.channel === TextureChannel.RGBA ? 0x02 : (r.channel << 1) | 0x01
		attribC |= samplers.x << 6

		const ss = r as SpriteWithSecondaryData

		if (ss != null) {
			sl = ss.secondaryLeft
			st = ss.secondaryTop
			sr = ss.secondaryRight
			sb = ss.secondaryBottom

			attribC = attribC | (ss.secondaryChannel + (4 | 8))

			attribC = attribC | (samplers.y + 9)
		}

		const fAttribC = attribC
		vertices.set2(nv, a, r.left, r.top, sl, st, paletteTextureIndex, fAttribC)

		vertices.set2(
			nv + 1,
			b,
			r.right,
			r.top,
			sr,
			st,
			paletteTextureIndex,
			fAttribC
		)

		vertices.set2(
			nv + 2,
			c,
			r.right,
			r.bottom,
			sr,
			sb,
			paletteTextureIndex,
			fAttribC
		)

		vertices.set2(
			nv + 3,
			c,
			r.right,
			r.bottom,
			sr,
			sb,
			paletteTextureIndex,
			fAttribC
		)

		vertices.set2(
			nv + 4,
			d,
			r.left,
			r.bottom,
			sl,
			sb,
			paletteTextureIndex,
			fAttribC
		)

		vertices.set2(
			nv + 5,
			a,
			r.left,
			r.top,
			sl,
			st,
			paletteTextureIndex,
			fAttribC
		)
	}

	static fastCopyIntoChannel(dest: Sprite, src: Uint8ClampedArray) {
		const destData = dest.sheet.getData()
		const width = dest.bounds.width
		const height = dest.bounds.height

		if (dest.channel == TextureChannel.RGBA) {
			const destStride = dest.sheet.size.width
			const data = destData
			const x = dest.bounds.left
			const y = dest.bounds.top
			let k = 0

			for (let j = 0; j < height; j++) {
				for (let i = 0; i < width; i++) {
					const r = src[k++]
					const g = src[k++]
					const b = src[k++]
					const a = src[k++]
					const cc = Color.fromArgb(a, r, g, b)

					data[(y + j) * destStride * 4 + (x + i) * 4 + 0] = cc.r
					data[(y + j) * destStride * 4 + (x + i) * 4 + 1] = cc.g
					data[(y + j) * destStride * 4 + (x + i) * 4 + 2] = cc.b
					data[(y + j) * destStride * 4 + (x + i) * 4 + 3] = cc.a
				}
			}
		} else {
			const destStride = dest.sheet.size.width * 4
			let destOffset =
				destStride * dest.bounds.top +
				(dest.bounds.left * 4 + Util.ChannelMasks[dest.channel])
			const destSkip = destStride - 4 * width
			const srcOffset = 0

			for (let j = 0; j < height; j++) {
				for (let i = 0; i < width; i++) {
					destData[destOffset] = src[srcOffset]
					destOffset += 4
				}

				destOffset = destOffset + destSkip
			}
		}
	}

	static fastCopyIntoSprite(dest: Sprite, src: PNG.Image) {
		const destData = dest.sheet.getData()
		const destStride = dest.sheet.size.width
		const width = dest.bounds.width
		const height = dest.bounds.height
		const data = destData
		const x = dest.bounds.left
		const y = dest.bounds.top
		const srcData = new Uint8ClampedArray(src.data)

		let k = 0

		for (let j = 0; j < height; j++) {
			for (let i = 0; i < width; i++) {
				const r = srcData[k++]
				const g = srcData[k++]
				const b = srcData[k++]
				const a = srcData[k++]

				const cc = Util.premultiplyAlpha(Color.fromArgb(a, r, g, b))

				data[(y + j) * destStride * 4 + (x + i) * 4 + 0] = cc.r
				data[(y + j) * destStride * 4 + (x + i) * 4 + 1] = cc.g
				data[(y + j) * destStride * 4 + (x + i) * 4 + 2] = cc.b
				data[(y + j) * destStride * 4 + (x + i) * 4 + 3] = cc.a
			}
		}
	}

	static premultiplyAlpha(c: Color): Color {
		if (c.a == 255) {
			return c
		}

		const a = c.a / 255

		return Color.fromArgb(c.a, c.r * a + 0.5, c.g * a + 0.5, c.b * a + 0.5)
	}

	static premultipliedColorLerp(t: number, c1: Color, c2: Color): Color {
		//  Colors must be lerped in a non-multiplied color space
		const a1 = 255 / c1.a
		const a2 = 255 / c2.a

		return Util.premultiplyAlpha(
			Color.fromArgb(
				t * c2.a + (1 - t) * c1.a,
				t * (a2 * c2.r) + 0.5 + (1 - t) * (a1 * c1.r + 0.5),
				t * (a2 * c2.g) + 0.5 + (1 - t) * (a1 * c1.g + 0.5),
				t * (a2 * c2.b) + 0.5 + (1 - t) * (a1 * c1.b + 0.5)
			)
		)
	}

	static identityMatrix(): number[] {
		return makeArray(16, j => (j % 5 == 0 ? 1 : 0))
	}

	static scaleMatrix(sx: number, sy: number, sz: number): number[] {
		const mtx = Util.identityMatrix()
		mtx[0] = sx
		mtx[5] = sy
		mtx[10] = sz

		return mtx
	}

	static TranslationMatrix(x: number, y: number, z: number): number[] {
		const mtx = Util.identityMatrix()
		mtx[12] = x
		mtx[13] = y
		mtx[14] = z

		return mtx
	}

	static matrixMultiply(lhs: number[], rhs: number[]): number[] {
		const mtx = new Array(16)

		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				mtx[4 * i + j] = 0

				for (let k = 0; k < 4; k++) {
					mtx[4 * i + j] = mtx[4 * i + j] + lhs[4 * k + j] * rhs[4 * i + k]
				}
			}
		}

		return mtx
	}

	static matrixVectorMultiply(mtx: number[], vec: number[]): number[] {
		const ret = new Array(4)

		for (let j = 0; j < 4; j++) {
			ret[j] = 0

			for (let k = 0; k < 4; k++) {
				ret[j] = ret[j] + mtx[4 * k + j] * vec[k]
			}
		}

		return ret
	}

	static matrixInverse(m: number[]) {
		const mtx = new Array(16)

		mtx[0] =
			m[5] * (m[10] * m[15]) -
			(m[5] * (m[11] * m[14]) - m[9] * (m[6] * m[15])) +
			(m[9] * (m[7] * m[14]) +
				(m[13] * (m[6] * m[11]) - m[13] * (m[7] * m[10])))

		mtx[4] =
			m[4] * (m[10] * m[15]) * -1 +
			(m[4] * (m[11] * m[14]) +
				(m[8] * (m[6] * m[15]) -
					(m[8] * (m[7] * m[14]) - m[12] * (m[6] * m[11])) +
					m[12] * (m[7] * m[10])))

		mtx[8] =
			m[4] * (m[9] * m[15]) -
			(m[4] * (m[11] * m[13]) - m[8] * (m[5] * m[15])) +
			(m[8] * (m[7] * m[13]) + (m[12] * (m[5] * m[11]) - m[12] * (m[7] * m[9])))

		mtx[12] =
			m[4] * (m[9] * m[14]) * -1 +
			(m[4] * (m[10] * m[13]) +
				(m[8] * (m[5] * m[14]) -
					(m[8] * (m[6] * m[13]) - m[12] * (m[5] * m[10])) +
					m[12] * (m[6] * m[9])))

		mtx[1] =
			m[1] * (m[10] * m[15]) * -1 +
			(m[1] * (m[11] * m[14]) +
				(m[9] * (m[2] * m[15]) -
					(m[9] * (m[3] * m[14]) - m[13] * (m[2] * m[11])) +
					m[13] * (m[3] * m[10])))

		mtx[5] =
			m[0] * (m[10] * m[15]) -
			(m[0] * (m[11] * m[14]) - m[8] * (m[2] * m[15])) +
			(m[8] * (m[3] * m[14]) +
				(m[12] * (m[2] * m[11]) - m[12] * (m[3] * m[10])))

		mtx[9] =
			m[0] * (m[9] * m[15]) * -1 +
			(m[0] * (m[11] * m[13]) +
				(m[8] * (m[1] * m[15]) -
					(m[8] * (m[3] * m[13]) - m[12] * (m[1] * m[11])) +
					m[12] * (m[3] * m[9])))

		mtx[13] =
			m[0] * (m[9] * m[14]) -
			(m[0] * (m[10] * m[13]) - m[8] * (m[1] * m[14])) +
			(m[8] * (m[2] * m[13]) + (m[12] * (m[1] * m[10]) - m[12] * (m[2] * m[9])))

		mtx[2] =
			m[1] * (m[6] * m[15]) -
			(m[1] * (m[7] * m[14]) - m[5] * (m[2] * m[15])) +
			(m[5] * (m[3] * m[14]) + (m[13] * (m[2] * m[7]) - m[13] * (m[3] * m[6])))

		mtx[6] =
			m[0] * (m[6] * m[15]) * -1 +
			(m[0] * (m[7] * m[14]) +
				(m[4] * (m[2] * m[15]) -
					(m[4] * (m[3] * m[14]) - m[12] * (m[2] * m[7])) +
					m[12] * (m[3] * m[6])))

		mtx[10] =
			m[0] * (m[5] * m[15]) -
			(m[0] * (m[7] * m[13]) - m[4] * (m[1] * m[15])) +
			(m[4] * (m[3] * m[13]) + (m[12] * (m[1] * m[7]) - m[12] * (m[3] * m[5])))

		mtx[14] =
			m[0] * (m[5] * m[14]) * -1 +
			(m[0] * (m[6] * m[13]) +
				(m[4] * (m[1] * m[14]) -
					(m[4] * (m[2] * m[13]) - m[12] * (m[1] * m[6])) +
					m[12] * (m[2] * m[5])))

		mtx[3] =
			m[1] * (m[6] * m[11]) * -1 +
			(m[1] * (m[7] * m[10]) +
				(m[5] * (m[2] * m[11]) -
					(m[5] * (m[3] * m[10]) - m[9] * (m[2] * m[7])) +
					m[9] * (m[3] * m[6])))

		mtx[7] =
			m[0] * (m[6] * m[11]) -
			(m[0] * (m[7] * m[10]) - m[4] * (m[2] * m[11])) +
			(m[4] * (m[3] * m[10]) + (m[8] * (m[2] * m[7]) - m[8] * (m[3] * m[6])))

		mtx[11] =
			m[0] * (m[5] * m[11]) * -1 +
			(m[0] * (m[7] * m[9]) +
				(m[4] * (m[1] * m[11]) -
					(m[4] * (m[3] * m[9]) - m[8] * (m[1] * m[7])) +
					m[8] * (m[3] * m[5])))

		mtx[15] =
			m[0] * (m[5] * m[10]) -
			(m[0] * (m[6] * m[9]) - m[4] * (m[1] * m[10])) +
			(m[4] * (m[2] * m[9]) + (m[8] * (m[1] * m[6]) - m[8] * (m[2] * m[5])))

		const det =
			m[0] * mtx[0] + (m[1] * mtx[4] + (m[2] * mtx[8] + m[3] * mtx[12]))

		if (det == 0) {
			return null
		}

		for (let i = 0; i < 16; i++) {
			mtx[i] = mtx[i] * (1 / det)
		}

		return mtx
	}

	static MakeFloatMatrix(imtx: Int32Matrix4x4): number[] {
		const multipler = 1 / imtx.M44

		return [
			imtx.M11 * multipler,
			imtx.M12 * multipler,
			imtx.M13 * multipler,
			imtx.M14 * multipler,

			imtx.M21 * multipler,
			imtx.M22 * multipler,
			imtx.M23 * multipler,
			imtx.M24 * multipler,

			imtx.M31 * multipler,
			imtx.M32 * multipler,
			imtx.M33 * multipler,
			imtx.M34 * multipler,

			imtx.M41 * multipler,
			imtx.M42 * multipler,
			imtx.M43 * multipler,
			imtx.M44 * multipler
		]
	}

	static MatrixAABBMultiply(mtx: number[], bounds: number[]): number[] {
		//  Corner offsets
		const ix = [0, 0, 0, 0, 3, 3, 3, 3]
		const iy = [1, 1, 4, 4, 1, 1, 4, 4]
		const iz = [2, 5, 2, 5, 2, 5, 2, 5]

		//  Vectors to opposing corner
		const ret = [
			Number.MAX_VALUE,
			Number.MAX_VALUE,
			Number.MAX_VALUE,
			Number.MIN_VALUE,
			Number.MIN_VALUE,
			Number.MIN_VALUE
		]

		//  Transform vectors and find new bounding box
		for (let i = 0; i < 8; i++) {
			const vec = [bounds[ix[i]], bounds[iy[i]], bounds[iz[i]], 1]
			const tvec = this.matrixVectorMultiply(mtx, vec)

			ret[0] = Math.min(ret[0], tvec[0] / tvec[3])
			ret[1] = Math.min(ret[1], tvec[1] / tvec[3])
			ret[2] = Math.min(ret[2], tvec[2] / tvec[3])
			ret[3] = Math.max(ret[3], tvec[0] / tvec[3])
			ret[4] = Math.max(ret[4], tvec[1] / tvec[3])
			ret[5] = Math.max(ret[5], tvec[2] / tvec[3])
		}

		return ret
	}
}
