import { ReadOnlyPackage } from './file-system/types'
import yaml from 'yaml'
import { ab2str } from './utils/data'
import { ObjectCreator } from './object-creator'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MiniYaml = Record<string, any>

export class SpriteSequenceFormat {
	type: string
	metadata: Record<string, MiniYaml>

	constructor(yaml: MiniYaml) {
		this.type = yaml.Value
		this.metadata = yaml
	}
}

export class ModelSequenceFormat {
	type: string
	metadata: Record<string, MiniYaml>

	constructor(yaml: MiniYaml) {
		this.type = yaml.Value
		this.metadata = yaml
	}
}

export interface ModMetadata {
	title: string
	version: string
	website: string
	webIcon32: string
	hidden: boolean
}

/// <summary> Describes what is to be loaded in order to run a mod. </summary>
export class Manifest {
	static async create(modId: string, pkg: ReadOnlyPackage) {
		const data = (await pkg.getStream('mod.yaml'))?.buffer

		if (!data) {
			throw new Error(`Missing mod.yaml in ${modId}`)
		}

		return new Manifest(modId, pkg, data)
	}

	id: string
	package: ReadOnlyPackage
	metadata: ModMetadata

	rules: string[]
	serverTraits: string[]

	sequences: string[]
	modelSequences: string[]
	cursors: string[]
	chrome: string[]
	assemblies: string[]
	chromeLayout: string[]

	weapons: string[]
	voices: string[]
	notifications: string[]
	music: string[]
	translations: string[]
	tileSets: string[]

	chromeMetrics: string[]
	mapCompatibility: string[]
	missions: string[]
	hotkeys: string[]

	packages: Record<string, string> = {}
	mapFolders: Record<string, string>
	loadScreen: MiniYaml

	soundFormats: string[] = []
	spriteFormats: string[] = []
	packageFormats: string[] = []

	reservedModuleNames: string[] = [
		'Metadata',
		'Folders',
		'MapFolders',
		'Packages',
		'Rules',
		'Sequences',
		'ModelSequences',
		'Cursors',
		'Chrome',
		'Assemblies',
		'ChromeLayout',
		'Weapons',
		'Voices',
		'Notifications',
		'Music',
		'Translations',
		'TileSets',
		'ChromeMetrics',
		'Missions',
		'Hotkeys',
		'ServerTraits',
		'LoadScreen',
		'SupportsMapsFrom',
		'SoundFormats',
		'SpriteFormats',
		'RequiresMods',
		'PackageFormats'
	]

	modules = []
	yaml: MiniYaml

	customDataLoaded = false

	constructor(modId: string, pkg: ReadOnlyPackage, manifestData: ArrayBuffer) {
		this.id = modId
		this.package = pkg

		this.yaml = yaml.parse(ab2str(manifestData))

		this.metadata = this.yaml['Metadata']

		// TODO: Use fieldloader
		this.mapFolders = this.yaml['MapFolders']

		if (this.yaml['Packages']) {
			this.packages = this.yaml['Packages']
		}

		this.rules = this.yaml['Rules']
		this.sequences = this.yaml['Sequences']
		this.modelSequences = this.yaml['ModelSequences']
		this.cursors = this.yaml['Cursors']
		this.chrome = this.yaml['Chrome']
		this.assemblies = this.yaml['Assemblies']
		this.chromeLayout = this.yaml['ChromeLayout']
		this.weapons = this.yaml['Weapons']
		this.voices = this.yaml['Voices']
		this.notifications = this.yaml['Notifications']
		this.music = this.yaml['Music']
		this.translations = this.yaml['Translations']
		this.tileSets = this.yaml['TileSets']
		this.chromeMetrics = this.yaml['ChromeMetrics']
		this.missions = this.yaml['Missions']
		this.hotkeys = this.yaml['Hotkeys']

		this.serverTraits = this.yaml['ServerTraits']

		this.loadScreen = this.yaml['LoadScreen']

		if (!this.loadScreen) {
			throw new Error('`LoadScreen` section is not defined.')
		}

		// Allow inherited mods to import parent maps.
		let compat = [this.id]

		if (this.yaml['SupportsMapsFrom'] !== undefined) {
			compat = [
				...compat,
				...(this.yaml['SupportsMapsFrom'] as string)
					.split(',')
					.map(c => c.trim())
			]
		}

		this.mapCompatibility = compat

		if (this.yaml['PackageFormats'] !== undefined) {
			this.packageFormats = this.yaml['PackageFormats']
		}

		if (this.yaml['SoundFormats'] !== undefined) {
			this.soundFormats = this.yaml['SoundFormats']
		}

		if (this.yaml['SpriteFormats'] !== undefined) {
			this.spriteFormats = this.yaml['SpriteFormats']
		}
	}

	loadCustomData(oc: ObjectCreator) {
		for (const kv of Object.entries(this.yaml)) {
			if (this.reservedModuleNames.includes(kv[0])) {
				continue
			}

			// TODO: How to do this
			/*
      var t = oc.findType(kv[0]);
      if (t == null || !typeof(IGlobalModData).IsAssignableFrom(t))
        throw new InvalidDataException("`{0}` is not a valid mod manifest entry.".F(kv.Key));

      IGlobalModData module;
      var ctor = t.GetConstructor(new[] { typeof(MiniYaml) });
      if (ctor != null)
      {
        // Class has opted-in to DIY initialization
        module = (IGlobalModData)ctor.Invoke(new object[] { kv.Value });
      }
      else
      {
        // Automatically load the child nodes using FieldLoader
        module = oc.CreateObject<IGlobalModData>(kv.Key);
        FieldLoader.Load(module, kv.Value);
      }

      modules.Add(module);
      */
		}

		this.customDataLoaded = true
	}

	// TODO: How
	/*
  public bool Contains<T>() where T : IGlobalModData
  {
    return modules.Contains<T>();
  }

  /// <summary>Load a cached IGlobalModData instance.</summary>
  public T Get<T>() where T : IGlobalModData
  {
    if (!customDataLoaded)
      throw new InvalidOperationException("Attempted to call Manifest.Get() before loading custom data!");

    var module = modules.GetOrDefault<T>();

    // Lazily create the default values if not explicitly defined.
    if (module == null)
    {
      module = (T)Game.ModData.ObjectCreator.CreateBasic(typeof(T));
      modules.Add(module);
    }

    return module;
  }

  /// <summary>
  /// Load an uncached IGlobalModData instance directly from the manifest yaml.
  /// This should only be used by external mods that want to query data from this mod.
  /// </summary>
  public T Get<T>(ObjectCreator oc) where T : IGlobalModData
  {
    MiniYaml data;
    var t = typeof(T);
    if (!yaml.TryGetValue(t.Name, out data))
    {
      // Lazily create the default values if not explicitly defined.
      return (T)oc.CreateBasic(t);
    }

    IGlobalModData module;
    var ctor = t.GetConstructor(new[] { typeof(MiniYaml) });
    if (ctor != null)
    {
      // Class has opted-in to DIY initialization
      module = (IGlobalModData)ctor.Invoke(new object[] { data.Value });
    }
    else
    {
      // Automatically load the child nodes using FieldLoader
      module = oc.CreateObject<IGlobalModData>(t.Name);
      FieldLoader.Load(module, data);
    }

    return (T)module;
  }
  */
}
