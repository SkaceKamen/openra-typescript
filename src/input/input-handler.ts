import { Vector2 } from '../utils/math'
import { Key } from 'ts-key-enum'

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

export enum Modifiers {
	None = 0,
	Shift = 1,
	Alt = 2,
	Ctrl = 4,
	Meta = 8
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
