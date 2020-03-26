/* eslint-disable @typescript-eslint/no-explicit-any */

import { RecordCache } from './utils/cache'
import { Color } from './utils/color'
import { Game } from './game'
import { Size, Vector2, Vector3, Rectangle } from './utils/math'
import { BitSet } from './utils/bit-set'

const SERIALIZE_ATTRIBUTE = 'SERIALIZE_ATTRIBUTE'
const META_TYPE = 'design:type'

type SerializeAttributeValues = {
	serialize?: boolean
	yamlName?: string
	loader?: AttributeLoader
	fromYamlKey?: boolean
	dictionaryFromYamlKey?: boolean
	required?: boolean
	allowEmptyEntries?: boolean
	type?: FieldType
}

type FieldInfo = {
	name: string
	type: FieldType
	attr: SerializeAttributeValues
}

type FieldType = {
	type: string
	entity?: any
	subType?: FieldType[]
	enum?: any
}

type TypeInfo = {
	fields: Record<string, SerializeAttributeValues>
}

type AttributeLoader = (data: object) => object

export class FieldLoadInfo {
	field: FieldInfo
	attribute: SerializeAttributeValues
	yamlName: string
	loader?: AttributeLoader

	constructor(
		field: FieldInfo,
		attr: SerializeAttributeValues,
		yamlName: string,
		loader?: AttributeLoader
	) {
		this.field = field
		this.attribute = attr
		this.yamlName = yamlName
		this.loader = loader
	}
}

export class FieldLoader {
	static invalidValueAction = (s: any, t: any, f: any) => {
		throw new Error(`FieldLoader: Cannot parse ${s} into ${f}.${t}`)
	}

	static unknownFieldAction = (s: any, f: any) => {
		throw new Error(`FieldLoader: Missing field ${s} on ${f.name}`)
	}

	static types: Record<string, TypeInfo> = {}

	static typeLoadInfo: RecordCache<string, FieldLoadInfo[]> = new RecordCache<
		string,
		FieldLoadInfo[]
	>(FieldLoader.buildTypeLoadInfo)

	static memberHasTranslateAttribute: RecordCache<
		MemberInfo,
		boolean
	> = new RecordCache<MemberInfo, boolean>(member =>
		member.HasAttribute<TranslateAttribute>()
	)

	static booleanExpressionCache: RecordCache<
		string,
		BooleanExpression
	> = new RecordCache<string, BooleanExpression>(
		expression => new BooleanExpression(expression)
	)

	static integerExpressionCache: RecordCache<
		string,
		IntegerExpression
	> = new RecordCache<string, IntegerExpression>(
		expression => new IntegerExpression(expression)
	)

	static translations: Record<string, string>

	static load<T>(self: T, my: object) {
		const loadInfo = this.typeLoadInfo.get((self as any).constructor.name)
		const missing: string[] = []
		const md: Record<string, object> = my as any

		for (const fli of loadInfo) {
			let val: Record<string, any>

			if (fli.loader) {
				if (!fli.attribute.required || md[fli.yamlName] !== undefined) {
					val = fli.loader(my)
				} else {
					missing.push(fli.yamlName)
					continue
				}
			} else if (
				(val = this.tryGetValueFromYaml(fli.yamlName, fli.field, md)) ===
				undefined
			) {
				if (fli.attribute.required) {
					missing.push(fli.yamlName)
				}

				continue
			}

			;(self as any)[fli.field.name] = val
		}

		if (missing.length > 0) {
			throw new Error(`Missing yaml props: ${missing}`)
		}

		return self
	}

	static tryGetValueFromYaml(
		yamlName: string,
		field: FieldInfo,
		md: Record<string, object>
	) {
		if (md[yamlName] === undefined) {
			return null
		}

		return this.getValue(field.name, field.type, md[yamlName], field)
	}

	static loadField(target: Record<string, any>, key: string, value: string) {
		key = key.trim()
		const field = target.GetType().GetField(key, Flags)

		if (field != null) {
			const sa = field
				.GetCustomAttributes<SerializeAttribute>(false)
				.DefaultIfEmpty(SerializeAttribute.Default)
				.First()

			if (!sa.FromYamlKey) {
				field.SetValue(
					target,
					GetValue(field.Name, field.FieldType, value, field)
				)
			}

			return
		}

		const prop = target.GetType().GetProperty(key, Flags)

		if (prop != null) {
			const sa = prop
				.GetCustomAttributes<SerializeAttribute>(false)
				.DefaultIfEmpty(SerializeAttribute.Default)
				.First()

			if (!sa.FromYamlKey) {
				prop.SetValue(
					target,
					GetValue(prop.Name, prop.PropertyType, value, prop),
					null
				)
			}

			return
		}

		this.unknownFieldAction(key, target.constructor)
	}

	/*
	static getValue(field: string, value: string): T {
			return (<T>(GetValue(field, typeof(T), value, null)));
	}
	
	static getValue(fieldName: string, fieldType: FieldInfo, value: string): Object {
			return GetValue(fieldName, fieldType, value, null);
	}
	
	static getValue(fieldName: string, fieldType: FieldInfo, value: string, field: MemberInfo): Object {
			return GetValue(fieldName, fieldType, new MiniYaml(value), field);
	}
	*/

	static getValue(
		fieldName: string,
		fieldType: FieldType,
		yaml: string | object,
		field: FieldInfo
	): any {
		let value = yaml.toString()

		if (value && typeof value === 'string') {
			value = value.trim()
		}

		if (fieldType.type === 'number') {
			return parseFloat(value as string)
		} else if (fieldType.type === 'string') {
			if (
				field &&
				this.memberHasTranslateAttribute.get(field.name) &&
				value &&
				typeof value === 'string'
			) {
				return value.replace(new RegExp('@([^@]+)@'), (_, v) =>
					FieldLoader.translate(v)
				)
			}

			return value
		} else if (fieldType.type === 'Color') {
			let color: Color

			if (value && (color = Color.tryParse(value))) {
				return color
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'Hotkey') {
			let res: Hotkey

			if ((res = Hotkey.tryParse(value))) {
				return res
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'HotkeyReference') {
			return Game.modData.hotkeys[value]
		} else if (fieldType.type === 'WDist') {
			let res: WDist

			if ((res = WDist.tryParse(value))) {
				return res
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'WVec') {
			if (value && typeof value === 'string') {
				const parts = value.split(',')

				if (parts.length == 3) {
					let rz: WDist
					let rx: WDist
					let ry: WDist

					if (
						(rx = WDist.tryParse(parts[0])) &&
						(ry = WDist.tryParse(parts[1])) &&
						(rz = WDist.tryParse(parts[2]))
					) {
						return new WVec(rx, ry, rz)
					}
				}
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'WVec[]') {
			if (value && typeof value === 'string') {
				const parts = value.split(',')

				if (parts.length % 3 != 0) {
					return this.invalidValueAction(value, fieldType, fieldName)
				}

				const vecs = new Array(parts.length / 3)

				for (let i = 0; i < vecs.length; i++) {
					let rz: WDist
					let rx: WDist
					let ry: WDist

					if (
						(rx = WDist.tryParse(parts[3 * i])) &&
						(ry = WDist.tryParse(parts[3 * i + 1])) &&
						(rz = WDist.tryParse(parts[3 * i + 2]))
					) {
						vecs[i] = new WVec(rx, ry, rz)
					}
				}

				return vecs
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type == 'WPos') {
			if (value && typeof value === 'string') {
				const parts = value.split(',')

				if (parts.Length == 3) {
					let rz: WDist
					let rx: WDist
					let ry: WDist

					if (
						(rx = WDist.tryParse(parts[0])) &&
						(ry = WDist.tryParse(parts[1])) &&
						(rz = WDist.tryParse(parts[2]))
					) {
						return new WPos(rx, ry, rz)
					}
				}
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'WAngle') {
			try {
				return new WAngle(parseInt(value, 10))
			} catch (e) {
				return this.invalidValueAction(value, fieldType, fieldName)
			}
		} else if (fieldType.type === 'WRot') {
			try {
				if (value && typeof value === 'string') {
					const parts = value.split(',')

					if (parts.length === 3) {
						const ry: number = parseInt(parts[0], 10)
						const rr: number = parseInt(parts[1], 10)
						const rp: number = parseInt(parts[2], 10)

						return new WRot(new WAngle(rr), new WAngle(rp), new WAngle(ry))
					}
				}
			} catch (e) {}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'CPos') {
			try {
				if (value && typeof value === 'string') {
					const parts = value.split(',').filter(v => v.length > 0)

					return new CPos(parseInt(parts[0]), parseInt(parts[1]))
				}
			} catch (e) {}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'CVec') {
			try {
				if (value && typeof value === 'string') {
					const parts = value.split(',').filter(v => v.length > 0)

					return new CVec(parseInt(parts[0], 10), parseInt(parts[1], 10))
				}
			} catch (e) {}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'CVec[]') {
			try {
				if (value) {
					const parts = value.split(',')

					if (parts.length % 2 != 0) {
						return this.invalidValueAction(value, fieldType, fieldName)
					}

					const vecs = new Array(parts.length / 2)

					for (let i = 0; i < vecs.length; i++) {
						vecs[i] = new CVec(
							parseInt(parts[2 * i], 10),
							parseInt(parts[2 * i + 1], 10)
						)
					}

					return vecs
				}
			} catch (e) {}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'BooleanExpression') {
			if (value !== undefined && value !== null) {
				try {
					return this.booleanExpressionCache.get(value)
				} catch (e /*:InvalidDataException*/) {
					throw e
				}
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'IntegerExpression') {
			if (value != null) {
				try {
					return this.integerExpressionCache.get(value)
				} catch (e /*:InvalidDataException*/) {
					throw e
				}
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'enum') {
			const r = fieldType.enum[value]

			if (r !== undefined) {
				return r
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'boolean') {
			if (value.toLowerCase() === 'true' || value === '1') {
				return true
			}

			if (value.toLowerCase() === 'false' || value === '0') {
				return false
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'Vector2[]') {
			if (value != null) {
				const parts = value.split(',').filter(v => v.length > 0)

				if (parts.length % 2 !== 0) {
					return this.invalidValueAction(value, fieldType, fieldName)
				}

				const ints = new Array(parts.length / 2)

				for (let i = 0; i < ints.length; i++) {
					ints[i] = new Vector2(
						parseInt(parts[2 * i]),
						parseInt(parts[2 * i + 1])
					)
				}

				return ints
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'array' && fieldType.subType?.length === 1) {
			if (!value) {
				return []
			}

			let parts = value.split(',')

			if (field && !field.attr.allowEmptyEntries) {
				parts = parts.filter(v => v.length > 0)
			}

			const ret = []

			for (let i = 0; i < parts.length; i++) {
				ret.push(
					this.getValue(fieldName, fieldType.subType[0], parts[i].trim(), field)
				)
			}

			return ret
		} else if (fieldType.type === 'HashSet') {
			const set = {}

			if (value === undefined) {
				return set
			}

			const parts = value.split(',').filter(v => v.length > 0)

			for (let i = 0; i < parts.length; i++) {
				// TODO:
				// set[...] = this.getValue(fieldName, fieldType.subType[0], parts[i].trim(), field);
			}

			return set
		} else if (fieldType.type === 'dictionary') {
			const dict = {}

			const st = fieldType.subType

			if (st && st.length === 2) {
				if (st[0].type !== 'string') {
					throw new Error('Only string can be used as index in dictionary')
				}

				Object.entries(yaml).forEach(([key, value]) => {
					const val = this.getValue(fieldName, st[1], value, field)
					;(dict as any)[key] = val
				})
			}

			return dict
		} else if (fieldType.type === 'Size') {
			if (value) {
				const parts = value.split(',').filter(v => v.length > 0)

				return new Size(parseInt(parts[0], 10), parseInt(parts[1], 10))
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'Vector2') {
			if (value) {
				const parts = value.split(',').filter(v => v.length > 0)

				if (parts.length != 2) {
					return this.invalidValueAction(value, fieldType, fieldName)
				}

				const xx = parts[0].includes('%')
					? parseFloat(parts[0].replace('%', '')) * 0.01
					: parseFloat(parts[0])

				const yy = parts[1].includes('%')
					? parseFloat(parts[1].replace('%', '')) * 0.01
					: parseFloat(parts[1])

				return new Vector2(xx, yy)
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'Vector3') {
			if (value) {
				const parts = value.split(',').filter(v => v.length > 0)

				if (parts.length < 2) {
					return this.invalidValueAction(value, fieldType, fieldName)
				}

				const x: number = parseFloat(parts[0])
				const y: number = parseFloat(parts[1])
				const z: number = parts.length > 2 ? parseFloat(parts[2]) : 0

				return new Vector3(x, y, z)
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'Rectangle') {
			if (value) {
				const parts = value.split(',').filter(v => v.length > 0)

				return new Rectangle(
					parseInt(parts[0], 10),
					parseInt(parts[1], 10),
					parseInt(parts[2], 10),
					parseInt(parts[3], 10)
				)
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'BitSet') {
			if (value) {
				const parts = value
					.split(',')
					.filter(v => v.length > 0)
					.map(v => v.trim())

				return BitSet.fromValues(parts)
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else if (fieldType.type === 'DateTime') {
			let dt: DateTime

			if (
				DateTime.tryParseExact(
					value,
					'yyyy-MM-dd HH-mm-ss',
					CultureInfo.InvariantCulture,
					DateTimeStyles.AssumeUniversal,
					/* out */ dt
				)
			) {
				return dt
			}

			return this.invalidValueAction(value, fieldType, fieldName)
		} else {
			const conv = TypeDescriptor.GetConverter(fieldType)

			if (conv.canConvertFrom('string')) {
				try {
					return conv.ConvertFromInvariantString(value)
				} catch (e) {
					return this.invalidValueAction(value, fieldType, fieldName)
				}
			}
		}

		this.unknownFieldAction(`[Type] ${value}`, fieldType)

		return null
	}

	static getTypeLoadInfo(type: string): FieldLoadInfo[] {
		return this.typeLoadInfo.get(type).filter(fli => fli.attribute.serialize)
	}

	static buildTypeLoadInfo(type: string): FieldLoadInfo[] {
		const ret: FieldLoadInfo[] = []

		const fields: Record<string, SerializeAttributeValues> =
			FieldLoader.types[type]

		if (fields) {
			Object.entries(fields).forEach(([field, info]) => {
				if (!info.serialize) {
					return
				}

				const fieldType = {
					attr: info,
					type: info.type as FieldType,
					name: field
				}

				const yamlName = info.yamlName || field
				let loader = info.loader

				if (!loader && info.fromYamlKey) {
					loader = yaml =>
						FieldLoader.getValue(
							yamlName,
							info.type as FieldType,
							yaml,
							fieldType
						)
				}

				const fli = new FieldLoadInfo(fieldType, info, yamlName, loader)
				ret.push(fli)
			})
		}

		return ret
	}

	static IgnoreAttribute() {
		return (target: any, field: any) => {
			FieldLoader.Serialize({
				serialize: false
			})
		}
	}

	static RequireAttribute() {
		return (target: any, field: any) => {
			FieldLoader.Serialize({
				required: true
			})
		}
	}

	static AllowEmptyEntriesAttribute() {
		return (target: any, field: any) => {
			FieldLoader.Serialize({
				allowEmptyEntries: true
			})
		}
	}

	static LoadUsingAttribute(
		loader: (data: object) => object,
		required = false
	) {
		return (target: any, field: any) => {
			FieldLoader.Serialize({
				loader,
				required
			})
		}
	}

	static Serialize(data: SerializeAttributeValues) {
		return (target: any, field: any) => {
			const className = target.constructor.name
			const reflected = Reflect.getMetadata(META_TYPE, target, field)

			const info: SerializeAttributeValues = {
				serialize: true,
				required: false,
				allowEmptyEntries: false,
				type: {
					type:
						typeof reflected === 'object'
							? reflected.constructor.name
							: typeof reflected,
					entity: reflected
				},
				...data
			}

			if (!FieldLoader.types[className]) {
				FieldLoader.types[className] = {
					fields: {}
				}
			}

			FieldLoader.types[className].fields[field] = info

			Reflect.defineMetadata(SERIALIZE_ATTRIBUTE, info, target, field)
		}
	}

	static translate(key: string): string {
		if (!key || key.length === 0) {
			return key
		}

		if (!this.translations) {
			return key
		}

		let value: string

		if (!(value = this.translations[key])) {
			return key
		}

		return value
	}

	static setTranslations(translations: Record<string, string>) {
		FieldLoader.translations = translations
	}
}

export const TranslateAttribute = FieldLoader.Serialize({})

export const FieldFromYamlKeyAttribute = FieldLoader.Serialize({
	fromYamlKey: true
})

export const DictionaryFromYamlKeyAttribute = FieldLoader.Serialize({
	fromYamlKey: true,
	dictionaryFromYamlKey: true
})

export const Desc = () => {
	return (target: any, field: any) => {
		void 0
	}
}
