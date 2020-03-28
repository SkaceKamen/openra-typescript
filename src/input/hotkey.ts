import { Modifiers, KeyInput } from './input-handler'
import { Key } from 'ts-key-enum'
import { isNullOrWhiteSpace } from '../utils/string'

export class Hotkey {
	static invalid: Hotkey = new Hotkey(null, Modifiers.None)
	isValid(): boolean {
		return this.key !== null
	}
	key: Key | null
	modifiers: Modifiers

	static tryParse(s: string): Hotkey | null {
		if (isNullOrWhiteSpace(s)) {
			return null
		}

		const parts = s.split(' ')
		let key: Key
		if (!(key = Key[parts[0] as keyof typeof Key])) {
			let c: number
			if ((c = parseInt(parts[0], 10)) === Number.NaN) {
				return null
			}

			throw new Error(`Loading keycode from number is not supported`)
		}

		const mods = Modifiers.None
		if (parts.length >= 2) {
			s.substring(s.indexOf(' '))
				.split(' ')
				.forEach(mod => {
					const parsed = Modifiers.get(mod)
					if (!parsed) {
						return null
					}
					mods.add(parsed)
				})
		}

		return new Hotkey(key, mods)
	}

	static fromKeyInput(ki: KeyInput): Hotkey {
		return new Hotkey(ki.key, ki.modifiers)
	}

	constructor(virtKey: Key | null, mod: Modifiers) {
		this.key = virtKey
		this.modifiers = mod
	}

	equals(b: Hotkey): boolean {
		if (this.key === null) {
			return false
		}

		return this.key === b.key
	}

	getHashCode(): string {
		return `${this.key}-${this.modifiers.toString()}`
	}

	toString(): string {
		return `${this.key}-${this.modifiers.toString()}`
	}

	displayString(): string {
		if (!this.key) {
			return 'Unset'
		}

		let ret = Key[this.key] as string
		if (this.modifiers.hasModifier(Modifiers.Shift)) {
			ret = 'Shift + ' + ret
		}
		if (this.modifiers.hasModifier(Modifiers.Alt)) {
			ret = 'Alt + ' + ret
		}
		if (this.modifiers.hasModifier(Modifiers.Ctrl)) {
			ret = 'Ctrl + ' + ret
		}

		if (this.modifiers.hasModifier(Modifiers.Meta)) {
			ret = 'Meta +'
			ret
		}

		return ret
	}
}
