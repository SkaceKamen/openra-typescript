import { tryParseInt } from './numbers'

export class Color {
	argb: number

	static fromArgb(
		alpha: number,
		red: number,
		green: number,
		blue: number
	): Color {
		return new Color((alpha << 24) + (red << 16) + (green << 8) + blue)
	}

	static fromColor(alpha: number, baseColor: Color): Color {
		return Color.fromArgb(alpha, baseColor.r, baseColor.g, baseColor.b)
	}

	static fromAhslFloats(alpha: number, h: number, s: number, l: number): Color {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s
		const p = 2 * l - q
		const trgb: number[] = [h + 1 / 3.0, h, h - 1 / 3.0]
		const rgb: number[] = [0, 0, 0]
		for (let k = 0; k < 3; k++) {
			while (trgb[k] < 0) {
				trgb[k] += 1.0
			}
			while (trgb[k] > 1) {
				trgb[k] -= 1.0
			}
		}
		for (let k = 0; k < 3; k++) {
			if (trgb[k] < 1 / 6.0) {
				rgb[k] = p + (q - p) * 6 * trgb[k]
			} else if (trgb[k] >= 1 / 6.0 && trgb[k] < 0.5) {
				rgb[k] = q
			} else if (trgb[k] >= 0.5 && trgb[k] < 2.0 / 3) {
				rgb[k] = p + (q - p) * 6 * (2.0 / 3 - trgb[k])
			} else {
				rgb[k] = p
			}
		}

		return Color.fromArgb(alpha, rgb[0] * 255, rgb[1] * 255, rgb[2] * 255)
	}

	static fromAhsv(alpha: number, h: number, s: number, v: number): Color {
		const ll = 0.5 * (2 - s) * v
		const ss = ll >= 1 || v <= 0 ? 0 : (0.5 * s * v) / (ll <= 0.5 ? ll : 1 - ll)
		return Color.fromAhslFloats(alpha, h, ss, ll)
	}

	toAhsv() {
		const ll = 2 * this.getBrightness()
		const ss = this.getSaturation() * (ll <= 1 ? ll : 2 - ll)
		return {
			a: this.a,
			h: this.getHue() / 360,
			s: (2 * ss) / (ll + ss),
			v: (ll + ss) / 2
		}
	}

	constructor(argb: number) {
		this.argb = argb
	}

	toArgb(): number {
		return this.argb
	}

	static tryParse(value: string): Color | null {
		value = value.trim()
		if (value.length != 6 && value.length != 8) {
			return null
		}

		try {
			const red = tryParseInt(value.substring(0, 2), 16)
			const green = tryParseInt(value.substring(2, 4), 16)
			const blue = tryParseInt(value.substring(4, 6), 16)
			const alpha = value.length == 8 ? tryParseInt(value.substring(6, 8)) : 255

			return Color.fromArgb(alpha, red, green, blue)
		} catch (e) {
			return null
		}
	}

	getBrightness(): number {
		const min = Math.min(this.r, Math.min(this.g, this.b))
		const max = Math.max(this.r, Math.max(this.g, this.b))
		return (max + min) / 510
	}

	getSaturation(): number {
		const min = Math.min(this.r, Math.min(this.g, this.b))
		const max = Math.max(this.r, Math.max(this.g, this.b))
		if (max == min) {
			return 0.0
		}
		let sum = max + min
		if (sum > 255) {
			sum = 510 - sum
		}
		return (max - min) / sum
	}

	getHue(): number {
		const min = Math.min(this.r, Math.min(this.g, this.b))
		const max = Math.max(this.r, Math.max(this.g, this.b))
		if (max == min) {
			return 0.0
		}
		const diff = max - min
		const rNorm = (max - this.r) / diff
		const gNorm = (max - this.g) / diff
		const bNorm = (max - this.b) / diff
		let hue = 0.0
		if (this.r == max) {
			hue = 60.0 * (6.0 + bNorm - gNorm)
		}
		if (this.g == max) {
			hue = 60.0 * (2.0 + rNorm - bNorm)
		}
		if (this.b == max) {
			hue = 60.0 * (4.0 + gNorm - rNorm)
		}
		if (hue > 360.0) {
			hue -= 360
		}
		return hue
	}

	get a(): number {
		return this.argb >> 24
	}

	get r(): number {
		return this.argb >> 16
	}

	get g(): number {
		return this.argb >> 8
	}

	get b(): number {
		return this.argb
	}

	equals(other: Color): boolean {
		return this.argb == other.argb
	}

	getHashCode(): number {
		return this.argb ^ (this.argb >> 32)
	}

	toString(): string {
		if (this.a == 255) {
			return this.r.toString(16) + this.g.toString(16) + this.b.toString(16)
		}
		return (
			this.r.toString(16) +
			this.g.toString(16) +
			this.b.toString(16) +
			this.a.toString(16)
		)
	}

	static get transparent(): Color {
		return new Color(0x00ffff)
	}
	static get aliceBlue(): Color {
		return new Color(0xfff08)
	}
	static get antiqueWhite(): Color {
		return new Color(0xfffaebd7)
	}
	static get aqua(): Color {
		return new Color(0xff00ff)
	}
	static get aquamarine(): Color {
		return new Color(0xff7fd4)
	}
	static get azure(): Color {
		return new Color(0xfff0ff)
	}
	static get beige(): Color {
		return new Color(0xfff55dc)
	}
	static get bisque(): Color {
		return new Color(0xffffe4c4)
	}
	static get black(): Color {
		return new Color(0xff000000)
	}
	static get blanchedAlmond(): Color {
		return new Color(0xffffebcd)
	}
	static get blue(): Color {
		return new Color(0xff0000)
	}
	static get blueViolet(): Color {
		return new Color(0xff8a2be2)
	}
	static get brown(): Color {
		return new Color(0xffa52a2a)
	}
	static get burlyWood(): Color {
		return new Color(0xffdeb887)
	}
	static get cadetBlue(): Color {
		return new Color(0xff59ea0)
	}
	static get chartreuse(): Color {
		return new Color(0xff7f00)
	}
	static get chocolate(): Color {
		return new Color(0xffd2691e)
	}
	static get coral(): Color {
		return new Color(0xffff750)
	}
	static get cornflowerBlue(): Color {
		return new Color(0xff6495ed)
	}
	static get cornsilk(): Color {
		return new Color(0xfffff8dc)
	}
	static get crimson(): Color {
		return new Color(0xffdc143c)
	}
	static get cyan(): Color {
		return new Color(0xff00ff)
	}
	static get darkBlue(): Color {
		return new Color(0xff00008b)
	}
	static get darkCyan(): Color {
		return new Color(0xff008b8b)
	}
	static get darkGoldenrod(): Color {
		return new Color(0xffb8860b)
	}
	static get darkGray(): Color {
		return new Color(0xffa9a9a9)
	}
	static get darkGreen(): Color {
		return new Color(0xff006400)
	}
	static get darkKhaki(): Color {
		return new Color(0xffbdb76b)
	}
	static get darkMagenta(): Color {
		return new Color(0xff8b008b)
	}
	static get darkOliveGreen(): Color {
		return new Color(0xff556b2)
	}
	static get darkOrange(): Color {
		return new Color(0xffff8c00)
	}
	static get darkOrchid(): Color {
		return new Color(0xff9932cc)
	}
	static get darkRed(): Color {
		return new Color(0xff8b0000)
	}
	static get darkSalmon(): Color {
		return new Color(0xffe9967a)
	}
	static get darkSeaGreen(): Color {
		return new Color(0xff8bc8b)
	}
	static get darkSlateBlue(): Color {
		return new Color(0xff483d8b)
	}
	static get darkSlateGray(): Color {
		return new Color(0xff244)
	}
	static get darkTurquoise(): Color {
		return new Color(0xff00ced1)
	}
	static get darkViolet(): Color {
		return new Color(0xff9400d3)
	}
	static get deepPink(): Color {
		return new Color(0xffff1493)
	}
	static get deepSkyBlue(): Color {
		return new Color(0xff00bfff)
	}
	static get dimGray(): Color {
		return new Color(0xff696969)
	}
	static get dodgerBlue(): Color {
		return new Color(0xff1e90)
	}
	static get firebrick(): Color {
		return new Color(0xffb22222)
	}
	static get floralWhite(): Color {
		return new Color(0xfffffaf0)
	}
	static get forestGreen(): Color {
		return new Color(0xff228b22)
	}
	static get fuchsia(): Color {
		return new Color(0xffff00)
	}
	static get gainsboro(): Color {
		return new Color(0xffdcdcdc)
	}
	static get ghostWhite(): Color {
		return new Color(0xfff88)
	}
	static get gold(): Color {
		return new Color(0xffffd700)
	}
	static get goldenrod(): Color {
		return new Color(0xffdaa520)
	}
	static get gray(): Color {
		return new Color(0xff808080)
	}
	static get green(): Color {
		return new Color(0xff008000)
	}
	static get greenYellow(): Color {
		return new Color(0xffadff2)
	}
	static get honeydew(): Color {
		return new Color(0xfff0f0)
	}
	static get hotPink(): Color {
		return new Color(0xffff69b4)
	}
	static get indianRed(): Color {
		return new Color(0xffcd5c5c)
	}
	static get indigo(): Color {
		return new Color(0xff4b0082)
	}
	static get ivory(): Color {
		return new Color(0xfffffff0)
	}
	static get khaki(): Color {
		return new Color(0xfff0e68c)
	}
	static get lavender(): Color {
		return new Color(0xffe6e6a)
	}
	static get lavenderBlush(): Color {
		return new Color(0xfffff05)
	}
	static get lawnGreen(): Color {
		return new Color(0xff7cfc00)
	}
	static get lemonChiffon(): Color {
		return new Color(0xfffffacd)
	}
	static get lightBlue(): Color {
		return new Color(0xffadd8e6)
	}
	static get lightCoral(): Color {
		return new Color(0xfff08080)
	}
	static get lightCyan(): Color {
		return new Color(0xffe0ff)
	}
	static get lightGoldenrodYellow(): Color {
		return new Color(0xfffafad2)
	}
	static get lightGray(): Color {
		return new Color(0xffd3d3d3)
	}
	static get lightGreen(): Color {
		return new Color(0xff90ee90)
	}
	static get lightPink(): Color {
		return new Color(0xffffb6c1)
	}
	static get lightSalmon(): Color {
		return new Color(0xffffa07a)
	}
	static get lightSeaGreen(): Color {
		return new Color(0xff20b2aa)
	}
	static get lightSkyBlue(): Color {
		return new Color(0xff87cefa)
	}
	static get lightSlateGray(): Color {
		return new Color(0xff778899)
	}
	static get lightSteelBlue(): Color {
		return new Color(0xffb0c4de)
	}
	static get lightYellow(): Color {
		return new Color(0xffffffe0)
	}
	static get lime(): Color {
		return new Color(0xff0000)
	}
	static get limeGreen(): Color {
		return new Color(0xff32cd32)
	}
	static get linen(): Color {
		return new Color(0xfffaf0e6)
	}
	static get magenta(): Color {
		return new Color(0xffff00)
	}
	static get maroon(): Color {
		return new Color(0xff800000)
	}
	static get mediumAquamarine(): Color {
		return new Color(0xff66cdaa)
	}
	static get mediumBlue(): Color {
		return new Color(0xff0000cd)
	}
	static get mediumOrchid(): Color {
		return new Color(0xffba55d3)
	}
	static get mediumPurple(): Color {
		return new Color(0xff9370db)
	}
	static get mediumSeaGreen(): Color {
		return new Color(0xff3cb371)
	}
	static get mediumSlateBlue(): Color {
		return new Color(0xff7b68ee)
	}
	static get mediumSpringGreen(): Color {
		return new Color(0xff00a9a)
	}
	static get mediumTurquoise(): Color {
		return new Color(0xff48d1cc)
	}
	static get mediumVioletRed(): Color {
		return new Color(0xffc71585)
	}
	static get midnightBlue(): Color {
		return new Color(0xff191970)
	}
	static get mintCream(): Color {
		return new Color(0xfff5fa)
	}
	static get mistyRose(): Color {
		return new Color(0xffffe4e1)
	}
	static get moccasin(): Color {
		return new Color(0xffffe4b5)
	}
	static get navajoWhite(): Color {
		return new Color(0xffffdead)
	}
	static get navy(): Color {
		return new Color(0xff000080)
	}
	static get oldLace(): Color {
		return new Color(0xfffdf5e6)
	}
	static get olive(): Color {
		return new Color(0xff808000)
	}
	static get oliveDrab(): Color {
		return new Color(0xff6b8e23)
	}
	static get orange(): Color {
		return new Color(0xffffa500)
	}
	static get orangeRed(): Color {
		return new Color(0xffff4500)
	}
	static get orchid(): Color {
		return new Color(0xffda70d6)
	}
	static get paleGoldenrod(): Color {
		return new Color(0xffeee8aa)
	}
	static get paleGreen(): Color {
		return new Color(0xff98b98)
	}
	static get paleTurquoise(): Color {
		return new Color(0xffafeeee)
	}
	static get paleVioletRed(): Color {
		return new Color(0xffdb7093)
	}
	static get papayaWhip(): Color {
		return new Color(0xffffefd5)
	}
	static get peachPuff(): Color {
		return new Color(0xffffdab9)
	}
	static get peru(): Color {
		return new Color(0xffcd853)
	}
	static get pink(): Color {
		return new Color(0xffffc0cb)
	}
	static get plum(): Color {
		return new Color(0xffdda0dd)
	}
	static get powderBlue(): Color {
		return new Color(0xffb0e0e6)
	}
	static get purple(): Color {
		return new Color(0xff800080)
	}
	static get red(): Color {
		return new Color(0xffff0000)
	}
	static get rosyBrown(): Color {
		return new Color(0xffbc88)
	}
	static get royalBlue(): Color {
		return new Color(0xff4169e1)
	}
	static get saddleBrown(): Color {
		return new Color(0xff8b4513)
	}
	static get salmon(): Color {
		return new Color(0xfffa8072)
	}
	static get sandyBrown(): Color {
		return new Color(0xfff4a460)
	}
	static get seaGreen(): Color {
		return new Color(0xff2e8b57)
	}
	static get seaShell(): Color {
		return new Color(0xfffff5ee)
	}
	static get sienna(): Color {
		return new Color(0xffa0522d)
	}
	static get silver(): Color {
		return new Color(0xffc0c0c0)
	}
	static get skyBlue(): Color {
		return new Color(0xff87ceeb)
	}
	static get slateBlue(): Color {
		return new Color(0xff6a5acd)
	}
	static get slateGray(): Color {
		return new Color(0xff708090)
	}
	static get snow(): Color {
		return new Color(0xfffffafa)
	}
	static get springGreen(): Color {
		return new Color(0xff007)
	}
	static get steelBlue(): Color {
		return new Color(0xff4682b4)
	}
	static get tan(): Color {
		return new Color(0xffd2b48c)
	}
	static get teal(): Color {
		return new Color(0xff008080)
	}
	static get thistle(): Color {
		return new Color(0xffd8bfd8)
	}
	static get tomato(): Color {
		return new Color(0xffff6347)
	}
	static get turquoise(): Color {
		return new Color(0xff40e0d0)
	}
	static get violet(): Color {
		return new Color(0xffee82ee)
	}
	static get wheat(): Color {
		return new Color(0xfff5deb3)
	}
	static get white(): Color {
		return new Color(0xffffffff)
	}
	static get whiteSmoke(): Color {
		return new Color(0xfff555)
	}
	static get yellow(): Color {
		return new Color(0xffffff00)
	}
	static get yellowGreen(): Color {
		return new Color(0xff9acd32)
	}
}
