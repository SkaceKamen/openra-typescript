import { Vector2 } from './utils/math'
import { Color } from './utils/color'
import { Modifiers } from './input/input-handler'
import { Logger } from './log'
import { isNullOrWhiteSpace } from './utils/string'
import { Game } from './game'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Desc(_desc: string, _more?: string) {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
	return (_target: any, _prop: string) => {
		void 0
	}
}

export enum MouseScrollType {
	Disabled,
	Standard,
	Inverted,
	Joystick
}

export enum StatusBarsType {
	Standard,
	DamageShow,
	AlwaysShow
}

export enum TargetLinesType {
	Disabled,
	Manual,
	Automatic
}

export enum MPGameFilters {
	None = 0,
	Waiting = 1,
	Empty = 2,
	Protected = 4,
	Started = 8,
	Incompatible = 16
}

export enum WorldViewport {
	Native,
	Close,
	Medium,
	Far
}

export class ServerSettings {
	@Desc('Sets the server name.')
	name = 'OpenRA Game'

	@Desc('Sets the internal port.')
	listenPort = 1234

	@Desc('Reports the game to the master server list.')
	advertiseOnline = true

	@Desc('Locks the game with a password.')
	password = ''

	@Desc(
		'Allow users to enable NAT discovery for external IP detection and automatic port forwarding.'
	)
	discoverNatDevices = false

	@Desc('Time in milliseconds to search for UPnP enabled NAT devices.')
	natDiscoveryTimeout = 1000

	@Desc(
		'Starts the game with a default map. Input as hash that can be obtained by the utility.'
	)
	map: string | null = null

	@Desc(
		'Takes a comma separated list of IP addresses that are not allowed to join.'
	)
	ban: string[] = []

	@Desc('For dedicated servers only, allow anonymous clients to join.')
	requireAuthentication = false

	@Desc(
		'For dedicated servers only, if non-empty, only allow authenticated players with these profile IDs to join.'
	)
	profileIDWhitelist: number[] = []

	@Desc(
		'For dedicated servers only, if non-empty, always reject players with these user IDs from joining.'
	)
	profileIDBlacklist: number[] = []

	@Desc(
		'For dedicated servers only, controls whether a game can be started with just one human player in the lobby.'
	)
	enableSingleplayer = false

	@Desc(
		'Query map information from the Resource Center if they are not available locally.'
	)
	queryMapRepository = true

	@Desc('Enable client-side report generation to help debug desync errors.')
	enableSyncReports = false

	@Desc('Sets the timestamp format. Defaults to the ISO 8601 standard.')
	timestampFormat = 'yyyy-MM-ddTHH:mm:ss'

	@Desc(
		'Path to a MaxMind GeoLite2 database to use for player geo-location.',
		'Database files can be downloaded from https://dev.maxmind.com/geoip/geoip2/geolite2/'
	)
	geoIPDatabase: string | null = null

	@Desc('Allow clients to see anonymised IPs for other clients.')
	shareAnonymizedIPs = true
}

export class DebugSettings {
	@Desc('Display average FPS and tick/render times')
	perfText = false

	@Desc('Display a graph with various profiling traces')
	perfGraph = false

	@Desc(
		'Numer of samples to average over when calculating tick and render times.'
	)
	samples = 25

	@Desc('Check whether a newer version is available online.')
	checkVersion = true

	@Desc(
		'Allow the collection of anonymous data such as Operating System, .NET runtime, OpenGL version and language settings.'
	)
	sendSystemInformation = true

	@Desc('Version of sysinfo that the player last opted in or out of.')
	systemInformationVersionPrompt = 0

	@Desc('Sysinfo anonymous user identifier.')
	uUID = 'BROWSER'

	@Desc('Enable hidden developer settings in the Advanced settings tab.')
	displayDeveloperSettings = false

	@Desc('Display bot debug messages in the game chat.')
	botDebug = false

	@Desc('Display Lua debug messages in the game chat.')
	luaDebug = false

	@Desc(
		'Enable the chat field during replays to allow use of console commands.'
	)
	enableDebugCommandsInReplays = false

	@Desc('Amount of time required for triggering perf.log output.')
	longTickThresholdMs = 1

	@Desc(
		'Throw an exception if the world sync hash changes while evaluating user input.'
	)
	syncCheckUnsyncedCode = false

	@Desc(
		'Throw an exception if the world sync hash changes while evaluating BotModules.'
	)
	syncCheckBotModuleCode = false
}
export class GraphicSettings {
	@Desc('Screen resolution in fullscreen mode.')
	fullscreenSize: Vector2 = new Vector2(0, 0)

	@Desc('Screen resolution in windowed mode.')
	windowedSize: Vector2 = new Vector2(900, 600)

	cursorDouble = false

	viewportDistance: WorldViewport = WorldViewport.Medium

	uIScale = 1

	@Desc('Add a frame rate limiter.')
	capFramerate = false

	@Desc('At which frames per second to cap the framerate.')
	maxFramerate = 60

	@Desc('Disable separate OpenGL render thread on Windows operating systems.')
	disableWindowsRenderThread = true

	@Desc('Disable the OpenGL debug message callback feature.')
	disableGLDebugMessageCallback = false

	@Desc('Disable operating-system provided cursor rendering.')
	disableHardwareCursors = false

	@Desc('Use OpenGL ES if both ES and regular OpenGL are available.')
	preferGLES = false

	@Desc('Display index to use in a multi-monitor fullscreen setup.')
	videoDisplay = 0

	batchSize = 8192

	sheetSize = 2048

	language = 'english'

	defaultLanguage = 'english'
}

export class SoundSettings {
	soundVolume = 0.5

	musicVolume = 0.5

	videoVolume = 0.5

	shuffle = false

	repeat = false

	device: string | null = null

	cashTicks = true

	mute = false
}

export class PlayerSettings {
	@Desc('Sets the player nickname.')
	name = 'Commander'

	color: Color = Color.fromArgb(200, 32, 32)

	lastServer = 'localhost:1234'

	customColors: Color[] = []
}

export class GameSettings {
	platform = 'Default'
	viewportEdgeScroll = true
	viewportEdgeScrollMargin = 5
	lockMouseWindow = false
	mouseScroll: MouseScrollType = MouseScrollType.Joystick
	mouseButtonPreference: MouseButtonPreference = new MouseButtonPreference()
	viewportEdgeScrollStep = 30
	uIScrollSpeed = 50
	zoomSpeed = 0.04
	selectionDeadzone = 24
	mouseScrollDeadzone = 8
	useClassicMouseStyle = false
	classicMouseMiddleScroll = false
	statusBars: StatusBarsType = StatusBarsType.Standard
	targetLines: TargetLinesType = TargetLinesType.Manual
	usePlayerStanceColors = false
	allowDownloading = true
	@Desc('Filename of the authentication profile to use.')
	authProfile = 'player.oraid'
	zoomModifier: Modifiers = Modifiers.None
	fetchNews = true
	@Desc('Version of introduction prompt that the player last viewed.')
	introductionPromptVersion = 0

	mPGameFilters: MPGameFilters =
		MPGameFilters.Waiting |
		(MPGameFilters.Empty | (MPGameFilters.Protected | MPGameFilters.Started))
}

export class Settings {
	player: PlayerSettings = new PlayerSettings()

	game: GameSettings = new GameSettings()

	sound: SoundSettings = new SoundSettings()

	graphics: GraphicSettings = new GraphicSettings()

	server: ServerSettings = new ServerSettings()

	debug: DebugSettings = new DebugSettings()

	keys: Record<string, Hotkey> = {}

	sections: Record<string, object>

	//  A direct clone of the file loaded from disk.
	//  Any changed settings will be merged over this on save,
	//  allowing us to persist any unknown configuration keys
	yamlCache: Record<string, any> = {}

	constructor(savedData: object) {
		this.sections = {
			Player: this.player,
			Game: this.game,
			Sound: this.sound,
			Graphics: this.graphics,
			Server: this.server,
			Debug: this.debug
		}

		if (savedData) {
			this.yamlCache = savedData

			for (const savedSection in this.yamlCache) {
				const settingsSection = this.sections[savedSection]

				if (settingsSection) {
					Settings.loadSectionYaml(
						this.yamlCache[savedSection],
						settingsSection
					)
				}
			}

			const keysNode = this.yamlCache['Keys']

			if (keysNode != null) {
				Object.entries(keysNode).forEach(([key, value]) => {
					this.keys[key] = FieldLoader.getValue<Hotkey>(value)
				})
			}
		}
	}

	save() {
		for (const kv in this.sections) {
			let sectionYaml = this.yamlCache.firstOrDefault(() => {}, x.key == kv.key)

			if (sectionYaml == null) {
				sectionYaml = new MiniYamlNode(kv.key, new MiniYaml(''))
				this.yamlCache.add(sectionYaml)
			}

			const defaultValues = Activator.createInstance(kv.value.getType())
			const fields = FieldLoader.getTypeLoadInfo(kv.value.getType())

			for (const fli in fields) {
				const serialized = FieldSaver.formatValue(kv.value, fli.field)

				const defaultSerialized = FieldSaver.formatValue(
					defaultValues,
					fli.field
				)

				//  Fields with their default value are not saved in the settings yaml
				//  Make sure that we erase any previously defined custom values
				if (serialized == defaultSerialized) {
					sectionYaml.value.nodes.removeAll(() => {}, n.key == fli.yamlName)
				} else {
					//  Update or add the custom value
					const fieldYaml = sectionYaml.value.nodes.firstOrDefault(() => {},
					n.key == fli.yamlName)

					if (fieldYaml != null) {
						fieldYaml.value.value = serialized
					} else {
						sectionYaml.value.nodes.add(
							new MiniYamlNode(fli.yamlName, new MiniYaml(serialized))
						)
					}
				}
			}
		}

		let keysYaml = this.yamlCache.firstOrDefault(() => {}, x.key == 'Keys')

		if (keysYaml == null) {
			keysYaml = new MiniYamlNode('Keys', new MiniYaml(''))
			this.yamlCache.add(keysYaml)
		}

		keysYaml.value.nodes.clear()

		for (const kv in this.keys) {
			keysYaml.value.nodes.add(
				new MiniYamlNode(kv.key, FieldSaver.formatValue(kv.value))
			)
		}

		//  TODO: Save settings to local storage
		//  yamlCache.writeToFile(settingsFile);
	}

	static sanitizedName(dirty: string): string | null {
		if (!dirty) {
			return null
		}

		let clean = dirty

		//  reserved characters for MiniYAML and JSON
		const disallowedChars = [
			'#',
			'@',
			':',
			'\n',
			'\t',
			'[',
			']',
			'{',
			'}',
			'"',
			'`'
		]

		for (const disallowedChar in disallowedChars) {
			clean = clean.replace(new RegExp(disallowedChar, 'g'), '')
		}

		return clean
	}

	static sanitizedServerName(dirty: string): string {
		const clean = Settings.sanitizedName(dirty)

		if (!clean || isNullOrWhiteSpace(clean)) {
			return new ServerSettings().name
		} else {
			return clean
		}
	}

	static sanitizedPlayerName(dirty: string): string {
		const forbiddenNames = ['Open', 'Closed']

		/* TODO:
		const botNames = Game.modData.defaultRules.actors['player']
			.TraitInfos()
			.Select(() => {}, t.name)
		botNames.contains(clean)
		*/

		let clean = Settings.sanitizedName(dirty)

		if (!clean || isNullOrWhiteSpace(clean) || forbiddenNames.includes(clean)) {
			return new PlayerSettings().name
		}

		//  avoid UI glitches
		if (clean.length > 16) {
			clean = clean.substring(0, 16)
		}

		return clean
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static loadSectionYaml(yaml: any, section: any) {
		Object.entries(yaml).forEach(([key, value]) => {
			if (section[key] !== undefined) {
				section[key] = value
			}
		})
	}
}
