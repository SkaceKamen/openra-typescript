import { Vector2 } from '../utils/math'
import { Key } from 'ts-key-enum'
import { ucFirst } from '../utils/string'

export interface InputHandler {
	modifierKeys(mods: Modifiers): void
	onKeyInput(input: KeyInput): void
	onMouseInput(input: MouseInput): void
	onTextInput(text: string): void
}

export enum MouseInputEvent {
	Down,
	Move,
	Up,
	Scroll
}

export interface MouseInput {
	event: MouseInputEvent
	button: MouseButton
	location: Vector2
	delta: Vector2
	modifiers: Modifiers
	multiTapCount: number
}

export enum MouseButton {
	None = 0,
	Left = 1,
	Right = 2,
	Middle = 4
}

export class Modifiers {
	static None = new Modifiers(0)
	static Shift = new Modifiers(1)
	static Alt = new Modifiers(2)
	static Ctrl = new Modifiers(4)
	static Meta = new Modifiers(8)

	value: number

	constructor(value: number) {
		this.value = value
	}

	add(mod: Modifiers) {
		this.value = this.value | mod.value
	}

	sub(mod: Modifiers) {
		this.value = this.value ^ mod.value
	}

	hasModifier(mod: Modifiers) {
		return (this.value & mod.value) === mod.value
	}

	static get(name: string) {
		const exists = Modifiers[ucFirst(name) as keyof typeof Modifiers]
		if (exists) {
			return exists as Modifiers
		}

		return null
	}

	toString() {
		if (this.value === 0) {
			return 'None'
		}

		const res = []
		if (this.hasModifier(Modifiers.Shift)) {
			res.push('Shift')
		}
		if (this.hasModifier(Modifiers.Alt)) {
			res.push('Alt')
		}
		if (this.hasModifier(Modifiers.Ctrl)) {
			res.push('Ctrl')
		}
		if (this.hasModifier(Modifiers.Meta)) {
			res.push('Meta')
		}
		if (this.value === 0) {
			res.push('None')
		}

		return res.join('+')
	}
}

export enum KeyInputEvent {
	Down,
	Up
}

export interface KeyInput {
	event: KeyInputEvent
	key: Key
	modifiers: Modifiers
	multiTapCount: number
	unicodeChar: string
	isRepeat: boolean
}
