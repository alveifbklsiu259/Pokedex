// should I rename it to .d.ts?

// utilities
type ToUnderscore<T extends string> = T extends `${infer A}-${infer B}`
	? `${A}_${B}`
	: never;
type RemoveDash<T extends string> = T extends `${infer A}-${infer B}`
	? `${A}${Capitalize<string & B>}`
	: never;

export type GetStringOrNumberKey<T> = {
	[K in keyof T]: T[K] extends string | number ? K : never;
}[keyof T];

type GetObjectKey<T> = {
	// notice the never type at the end, that's the reason why T{keyof T} is not showing those member who has never type
	[K in keyof T]: T[K] extends object ? K : never;
}[keyof T];

type GetPrimitiveKey<T> = Exclude<keyof T, GetObjectKey<T>>;

type Obj = {
	name: string;
	age: number;
	test: number;
	pet: any[];
	test2: object;
};

type ObjKeys = GetObjectKey<Obj>;
type PrimitiveKeys = GetPrimitiveKey<Obj>;

// pickKeyByValue
// reference: https://stackoverflow.com/questions/55150760/how-to-write-pickbyvalue-type

type Test = {
	includeMe: "a";
	andMe: "a";
	butNotMe: "b";
	orMe: "b";
};

type PickByValue<T, V> = Pick<
	T,
	{ [K in keyof T]: T[K] extends V ? K : never }[keyof T]
>;
type TestA = PickByValue<Test, "a">; // {includeMe: "a"; andMe: "a"}
type IncludedKeys = keyof PickByValue<Test, "a">; // "includeMe" | "andMe"

// how to check if an union type has a specific type? e.g
// check if "string | number | boolean" has 'string'?

// type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;

export type Writable<T> = {
	- readonly [K in keyof T]: T[K];
};

// also works for tuple.
type GetArrayElementType<T extends unknown[]> = T[number];


// the intellisense is okay about it, but is this valid?
type C = [...any] // any[]








/* 
	Rules:
	1. camelCase for js variable
	2. PascalCase for ts type
*/
import { PokemonDataTypes } from "./src/features/pokemonData/pokemonDataSlice";

// type State = {
// 	pokemon: 'cached_pokemon'
// 	species: 'cached_species'
// 	allIdsandNames: 'allIds_Names'
// }

// type Values<T> = T[keyof T]

// let val: Values<State>;

// type D = typeof val

// type GetCachedData<T> = T extends `${infer A}_${infer B}` ? A extends 'cached' ? B : 'nonCached' : unknown

// type E = GetCachedData<D>

// type A = PokemonDataTypes

// type State = {
// 	pokemon: 'Cached_Pokemon'
// 	species: 'Cached_Species'
// 	allIdsandNames: 'AllNamesAndIds'
// }

// type GetValues<T> = T[keyof T]

// type StateValues = GetValues<State>

// type GetCachedData<T extends keyof State> = State[T] extends `${infer A}_${infer B}` ? A extends 'Cached' ? B : T :

// type E = GetCachedData<keyof State>

type State = {
	pokemon: "CachedPokemon";
	species: "CachedSpecies";
	allIdsandNames: "AllNamesAndIds";
};

type GetValues<T> = T[keyof T];

type StateValues = GetValues<State>;

type GetCachedData<T extends State> = {
	[K in keyof T]: T[K] extends `${infer A}${Capitalize<string & K>}`
		? K
		: unknown;
};

type Res = GetCachedData<State>;

// type ValStartsWith<T> = T[keyof T]

// type A<T> = {
// 	[key in keyof T]: T[key] extends {[name:string|number]: infer Q} ? Q : never
// }

// type B = A<PokemonDataTypes>

// type C = `${string & PokemonDataTypes[keyof PokemonDataTypes]}`

// is it possible to:
// 1. convert a literal type to namespace and vice versa
// 2. map a literal type to a already declared type? e.g. 'Pokemon' --> Pokemon
// 3. find all "Defined types" that starts with a certain word, e.g. interface CachedPokemon, interface CachedItem, and use the word "Cached" to search;

// maybe try Record?
// or maybe put all the types in a namespace then use namespace['xxx']?

/* 
interface CatInfo {
  age: number;
  breed: string;
}
 
type CatName = "miffy" | "boris" | "mordred";
 
const cats: Record<CatName, CatInfo> = {
  miffy: { age: 10, breed: "Persian" },
  boris: { age: 5, breed: "Maine Coon" },
  mordred: { age: 16, breed: "British Shorthair" },
};
 
cats.boris;


*/

export namespace Pokemon {
	export interface Root {
		abilities: Ability[];
		base_experience: number;
		forms: Form[];
		game_indices: Index[];
		height: number;
		held_items: any[];
		id: number;
		is_default: boolean;
		location_area_encounters: string;
		moves: Mfe[];
		name: string;
		order: number;
		past_types: any[];
		species: Species;
		sprites: Sprites;
		stats: Stat[];
		types: Type[];
		weight: number;
		formData?: PokemonForm.Root;
	}

	export interface Ability {
		ability: Ability2;
		is_hidden: boolean;
		slot: number;
	}

	export interface Ability2 {
		name: string;
		url: string;
	}

	export interface Form {
		name: string;
		url: string;
	}

	export interface Index {
		game_index: number;
		version: Version;
	}

	export interface Version {
		name: string;
		url: string;
	}

	export interface Mfe {
		move: Move;
		version_group_details: VersionGroupDetail[];
	}

	export interface Move {
		name: string;
		url: string;
	}

	export interface VersionGroupDetail {
		level_learned_at: number;
		move_learn_method: MoveLearnMethod;
		version_group: VersionGroup;
	}

	export interface MoveLearnMethod {
		name: string;
		url: string;
	}

	export interface VersionGroup {
		name: string;
		url: string;
	}

	export interface Species {
		name: string;
		url: string;
	}

	export interface Sprites {
		back_default: string;
		back_female: any;
		back_shiny: string;
		back_shiny_female: any;
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
		other: Other;
		versions: Versions;
	}

	export interface Other {
		dream_world: DreamWorld;
		home: Home;
		"official-artwork": OfficialArtwork;
	}

	export interface DreamWorld {
		front_default: string;
		front_female: any;
	}

	export interface Home {
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface OfficialArtwork {
		front_default: string;
		front_shiny: string;
	}

	export interface Versions {
		"generation-i": GenerationI;
		"generation-ii": GenerationIi;
		"generation-iii": GenerationIii;
		"generation-iv": GenerationIv;
		"generation-v": GenerationV;
		"generation-vi": GenerationVi;
		"generation-vii": GenerationVii;
		"generation-viii": GenerationViii;
	}

	export interface GenerationI {
		"red-blue": RedBlue;
		yellow: Yellow;
	}

	export interface RedBlue {
		back_default: string;
		back_gray: string;
		back_transparent: string;
		front_default: string;
		front_gray: string;
		front_transparent: string;
	}

	export interface Yellow {
		back_default: string;
		back_gray: string;
		back_transparent: string;
		front_default: string;
		front_gray: string;
		front_transparent: string;
	}

	export interface GenerationIi {
		crystal: Crystal;
		gold: Gold;
		silver: Silver;
	}

	export interface Crystal {
		back_default: string;
		back_shiny: string;
		back_shiny_transparent: string;
		back_transparent: string;
		front_default: string;
		front_shiny: string;
		front_shiny_transparent: string;
		front_transparent: string;
	}

	export interface Gold {
		back_default: string;
		back_shiny: string;
		front_default: string;
		front_shiny: string;
		front_transparent: string;
	}

	export interface Silver {
		back_default: string;
		back_shiny: string;
		front_default: string;
		front_shiny: string;
		front_transparent: string;
	}

	export interface GenerationIii {
		emerald: Emerald;
		"firered-leafgreen": FireredLeafgreen;
		"ruby-sapphire": RubySapphire;
	}

	export interface Emerald {
		front_default: string;
		front_shiny: string;
	}

	export interface FireredLeafgreen {
		back_default: string;
		back_shiny: string;
		front_default: string;
		front_shiny: string;
	}

	export interface RubySapphire {
		back_default: string;
		back_shiny: string;
		front_default: string;
		front_shiny: string;
	}

	export interface GenerationIv {
		"diamond-pearl": DiamondPearl;
		"heartgold-soulsilver": HeartgoldSoulsilver;
		platinum: Platinum;
	}

	export interface DiamondPearl {
		back_default: string;
		back_female: any;
		back_shiny: string;
		back_shiny_female: any;
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface HeartgoldSoulsilver {
		back_default: string;
		back_female: any;
		back_shiny: string;
		back_shiny_female: any;
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface Platinum {
		back_default: string;
		back_female: any;
		back_shiny: string;
		back_shiny_female: any;
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface GenerationV {
		"black-white": BlackWhite;
	}

	export interface BlackWhite {
		animated: Animated;
		back_default: string;
		back_female: any;
		back_shiny: string;
		back_shiny_female: any;
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface Animated {
		back_default: string;
		back_female: any;
		back_shiny: string;
		back_shiny_female: any;
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface GenerationVi {
		"omegaruby-alphasapphire": OmegarubyAlphasapphire;
		"x-y": XY;
	}

	export interface OmegarubyAlphasapphire {
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface XY {
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface GenerationVii {
		icons: Icons;
		"ultra-sun-ultra-moon": UltraSunUltraMoon;
	}

	export interface Icons {
		front_default: string;
		front_female: any;
	}

	export interface UltraSunUltraMoon {
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface GenerationViii {
		icons: Icons2;
	}

	export interface Icons2 {
		front_default: string;
		front_female: any;
	}

	export interface Stat {
		base_stat: number;
		effort: number;
		stat: Stat2;
	}

	export interface Stat2 {
		name: string;
		url: string;
	}

	export interface Type {
		slot: number;
		type: Type2;
	}

	export interface Type2 {
		name: string;
		url: string;
	}
}

export namespace PokemonSpecies {
	export interface Root {
		base_happiness: number;
		capture_rate: number;
		color: Color;
		egg_groups: EggGroup[];
		evolution_chain: EvolutionChain;
		evolves_from_species: EvolvesFromSpecies;
		flavor_text_entries: FlavorTextEntry[];
		form_descriptions: any[];
		forms_switchable: boolean;
		gender_rate: number;
		genera: Genera[];
		generation: Generation;
		growth_rate: GrowthRate;
		habitat: Habitat;
		has_gender_differences: boolean;
		hatch_counter: number;
		id: number;
		is_baby: boolean;
		is_legendary: boolean;
		is_mythical: boolean;
		name: string;
		names: Name[];
		order: number;
		pal_park_encounters: PalParkEncounter[];
		pokedex_numbers: PokedexNumber[];
		shape: Shape;
		varieties: Variety[];
	}

	export interface Color {
		name: string;
		url: string;
	}

	export interface EggGroup {
		name: string;
		url: string;
	}

	export interface EvolutionChain {
		url: string;
	}

	export interface EvolvesFromSpecies {
		name: string;
		url: string;
	}

	export interface FlavorTextEntry {
		flavor_text: string;
		language: Language;
		version: Version;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface Version {
		name: string;
		url: string;
	}

	export interface Genera {
		genus: string;
		language: Language2;
	}

	export interface Language2 {
		name: string;
		url: string;
	}

	export interface Generation {
		name: string;
		url: string;
	}

	export interface GrowthRate {
		name: string;
		url: string;
	}

	export interface Habitat {
		name: string;
		url: string;
	}

	export interface Name {
		language: Language3;
		name: string;
	}

	export interface Language3 {
		name: string;
		url: string;
	}

	export interface PalParkEncounter {
		area: Area;
		base_score: number;
		rate: number;
	}

	export interface Area {
		name: string;
		url: string;
	}

	export interface PokedexNumber {
		entry_number: number;
		pokedex: Pokedex;
	}

	export interface Pokedex {
		name: string;
		url: string;
	}

	export interface Shape {
		name: string;
		url: string;
	}

	export interface Variety {
		is_default: boolean;
		pokemon: Pokemon;
	}

	export interface Pokemon {
		name: string;
		url: string;
	}
}

export namespace PokemonForm {
	export interface Root {
		form_name: string;
		form_names: FormName[];
		form_order: number;
		id: number;
		is_battle_only: boolean;
		is_default: boolean;
		is_mega: boolean;
		name: string;
		names: Name[];
		order: number;
		pokemon: Pokemon;
		sprites: Sprites;
		types: Type[];
		version_group: VersionGroup;
	}

	export interface FormName {
		language: Language;
		name: string;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface Name {
		language: Language2;
		name: string;
	}

	export interface Language2 {
		name: string;
		url: string;
	}

	export interface Pokemon {
		name: string;
		url: string;
	}

	export interface Sprites {
		back_default: string;
		back_female: any;
		back_shiny: string;
		back_shiny_female: any;
		front_default: string;
		front_female: any;
		front_shiny: string;
		front_shiny_female: any;
	}

	export interface Type {
		slot: number;
		type: Type2;
	}

	export interface Type2 {
		name: string;
		url: string;
	}

	export interface VersionGroup {
		name: string;
		url: string;
	}
}

export namespace Type {
	export interface Root {
		damage_relations: DamageRelations;
		game_indices: Index[];
		generation: Generation2;
		id: number;
		move_damage_class: MoveDamageClass;
		moves: Mfe[];
		name: string;
		names: Name[];
		past_damage_relations: PastDamageRelation[];
		pokemon: Pokemon[];
	}

	export interface DamageRelations {
		double_damage_from: DoubleDamageFrom[];
		double_damage_to: DoubleDamageTo[];
		half_damage_from: HalfDamageFrom[];
		half_damage_to: HalfDamageTo[];
		no_damage_from: any[];
		no_damage_to: any[];
	}

	export interface DoubleDamageFrom {
		name: string;
		url: string;
	}

	export interface DoubleDamageTo {
		name: string;
		url: string;
	}

	export interface HalfDamageFrom {
		name: string;
		url: string;
	}

	export interface HalfDamageTo {
		name: string;
		url: string;
	}

	export interface Index {
		game_index: number;
		generation: Generation;
	}

	export interface Generation {
		name: string;
		url: string;
	}

	export interface Generation2 {
		name: string;
		url: string;
	}

	export interface MoveDamageClass {
		name: string;
		url: string;
	}

	export interface Mfe {
		name: string;
		url: string;
	}

	export interface Name {
		language: Language;
		name: string;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface PastDamageRelation {
		damage_relations: DamageRelations2;
		generation: Generation3;
	}

	export interface DamageRelations2 {
		double_damage_from: DoubleDamageFrom2[];
		double_damage_to: DoubleDamageTo2[];
		half_damage_from: HalfDamageFrom2[];
		half_damage_to: HalfDamageTo2[];
		no_damage_from: any[];
		no_damage_to: any[];
	}

	export interface DoubleDamageFrom2 {
		name: string;
		url: string;
	}

	export interface DoubleDamageTo2 {
		name: string;
		url: string;
	}

	export interface HalfDamageFrom2 {
		name: string;
		url: string;
	}

	export interface HalfDamageTo2 {
		name: string;
		url: string;
	}

	export interface Generation3 {
		name: string;
		url: string;
	}

	export interface Pokemon {
		pokemon: Pokemon2;
		slot: number;
	}

	export interface Pokemon2 {
		name: string;
		url: string;
	}
}

export namespace Move {
	export interface Root {
		accuracy: number;
		contest_combos: ContestCombos;
		contest_effect: ContestEffect;
		contest_type: ContestType;
		damage_class: DamageClass;
		effect_chance: number;
		effect_changes: any[];
		effect_entries: EffectEntry[];
		flavor_text_entries: FlavorTextEntry[];
		generation: Generation;
		id: number;
		learned_by_pokemon: LearnedByPokemon[];
		machines: Machine[];
		meta: Meta;
		name: string;
		names: Name[];
		past_values: any[];
		power: number;
		pp: number;
		priority: number;
		stat_changes: any[];
		super_contest_effect: SuperContestEffect;
		target: Target;
		type: Type;
	}

	export interface ContestCombos {
		normal: Normal;
		super: Super;
	}

	export interface Normal {
		use_after: UseAfter[];
		use_before: UseBefore[];
	}

	export interface UseAfter {
		name: string;
		url: string;
	}

	export interface UseBefore {
		name: string;
		url: string;
	}

	export interface Super {
		use_after: any;
		use_before: any;
	}

	export interface ContestEffect {
		url: string;
	}

	export interface ContestType {
		name: string;
		url: string;
	}

	export interface DamageClass {
		name: string;
		url: string;
	}

	export interface EffectEntry {
		effect: string;
		language: Language;
		short_effect: string;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface FlavorTextEntry {
		flavor_text: string;
		language: Language2;
		version_group: VersionGroup;
	}

	export interface Language2 {
		name: string;
		url: string;
	}

	export interface VersionGroup {
		name: string;
		url: string;
	}

	export interface Generation {
		name: string;
		url: string;
	}

	export interface LearnedByPokemon {
		name: string;
		url: string;
	}

	export interface Machine {
		machine: Machine2;
		version_group: VersionGroup2;
	}

	export interface Machine2 {
		url: string;
	}

	export interface VersionGroup2 {
		name: string;
		url: string;
	}

	export interface Meta {
		ailment: Ailment;
		ailment_chance: number;
		category: Category;
		crit_rate: number;
		drain: number;
		flinch_chance: number;
		healing: number;
		max_hits: any;
		max_turns: any;
		min_hits: any;
		min_turns: any;
		stat_chance: number;
	}

	export interface Ailment {
		name: string;
		url: string;
	}

	export interface Category {
		name: string;
		url: string;
	}

	export interface Name {
		language: Language3;
		name: string;
	}

	export interface Language3 {
		name: string;
		url: string;
	}

	export interface SuperContestEffect {
		url: string;
	}

	export interface Target {
		name: string;
		url: string;
	}

	export interface Type {
		name: string;
		url: string;
	}
}

export namespace Machine {
	export interface Root {
		id: number;
		item: Item;
		move: Move;
		version_group: VersionGroup;
	}

	export interface Item {
		name: string;
		url: string;
	}

	export interface Move {
		name: string;
		url: string;
	}

	export interface VersionGroup {
		name: string;
		url: string;
	}
}

export namespace Stat {
	export interface Root {
		affecting_moves: AffectingMoves;
		affecting_natures: AffectingNatures;
		characteristics: Characteristic[];
		game_index: number;
		id: number;
		is_battle_only: boolean;
		move_damage_class: any;
		name: string;
		names: Name[];
	}

	export interface AffectingMoves {
		decrease: any[];
		increase: any[];
	}

	export interface AffectingNatures {
		decrease: any[];
		increase: any[];
	}

	export interface Characteristic {
		url: string;
	}

	export interface Name {
		language: Language;
		name: string;
	}

	export interface Language {
		name: string;
		url: string;
	}
}

export namespace MoveDamageClass {
	export interface Root {
		descriptions: Description[];
		id: number;
		moves: Mfe[];
		name: string;
		names: Name[];
	}

	export interface Description {
		description: string;
		language: Language;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface Mfe {
		name: string;
		url: string;
	}

	export interface Name {
		language: Language2;
		name: string;
	}

	export interface Language2 {
		name: string;
		url: string;
	}
}

export namespace Version {
	export interface Root {
		id: number;
		name: string;
		names: Name[];
		version_group: VersionGroup;
	}

	export interface Name {
		language: Language;
		name: string;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface VersionGroup {
		name: string;
		url: string;
	}
}

export namespace Generation {
	export interface Root {
		abilities: any[];
		id: number;
		main_region: MainRegion;
		moves: Mfe[];
		name: string;
		names: Name[];
		pokemon_species: PokemonSpecy[];
		types: Type[];
		version_groups: VersionGroup[];
	}

	export interface MainRegion {
		name: string;
		url: string;
	}

	export interface Mfe {
		name: string;
		url: string;
	}

	export interface Name {
		language: Language;
		name: string;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface PokemonSpecy {
		name: string;
		url: string;
	}

	export interface Type {
		name: string;
		url: string;
	}

	export interface VersionGroup {
		name: string;
		url: string;
	}
}

export namespace Item {
	export interface Root {
		attributes: Attribute[];
		baby_trigger_for: any;
		category: Category;
		cost: number;
		effect_entries: EffectEntry[];
		flavor_text_entries: FlavorTextEntry[];
		fling_effect: any;
		fling_power: number;
		game_indices: Index[];
		held_by_pokemon: any[];
		id: number;
		machines: any[];
		name: string;
		names: Name[];
		sprites: Sprites;
	}

	export interface Attribute {
		name: string;
		url: string;
	}

	export interface Category {
		name: string;
		url: string;
	}

	export interface EffectEntry {
		effect: string;
		language: Language;
		short_effect: string;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface FlavorTextEntry {
		language: Language2;
		text: string;
		version_group: VersionGroup;
	}

	export interface Language2 {
		name: string;
		url: string;
	}

	export interface VersionGroup {
		name: string;
		url: string;
	}

	export interface Index {
		game_index: number;
		generation: Generation;
	}

	export interface Generation {
		name: string;
		url: string;
	}

	export interface Name {
		language: Language3;
		name: string;
	}

	export interface Language3 {
		name: string;
		url: string;
	}

	export interface Sprites {
		default: string;
	}
}

export namespace EvolutionChainResponse {
	export interface Root {
		baby_trigger_item: any;
		chain: Chain;
		id: number;
	}

	export interface Chain {
		evolution_details: any[];
		evolves_to: EvolvesTo[];
		is_baby: boolean;
		species: Species3;
	}

	export interface EvolvesTo {
		evolution_details: EvolutionDetail[];
		evolves_to: EvolvesTo2[];
		is_baby: boolean;
		species: Species2;
	}

	export interface EvolutionDetail {
		gender: any;
		held_item: any;
		item: any;
		known_move: any;
		known_move_type: any;
		location: any;
		min_affection: any;
		min_beauty: any;
		min_happiness: any;
		min_level: number;
		needs_overworld_rain: boolean;
		party_species: any;
		party_type: any;
		relative_physical_stats: any;
		time_of_day: string;
		trade_species: any;
		trigger: Trigger;
		turn_upside_down: boolean;
	}

	export interface Trigger {
		name: string;
		url: string;
	}

	export interface EvolvesTo2 {
		evolution_details: EvolutionDetail2[];
		evolves_to: any[];
		is_baby: boolean;
		species: Species;
	}

	export interface EvolutionDetail2 {
		gender: any;
		held_item: any;
		item: any;
		known_move: any;
		known_move_type: any;
		location: any;
		min_affection: any;
		min_beauty: any;
		min_happiness: any;
		min_level: number;
		needs_overworld_rain: boolean;
		party_species: any;
		party_type: any;
		relative_physical_stats: any;
		time_of_day: string;
		trade_species: any;
		trigger: Trigger2;
		turn_upside_down: boolean;
	}

	export interface Trigger2 {
		name: string;
		url: string;
	}

	export interface Species {
		name: string;
		url: string;
	}

	export interface Species2 {
		name: string;
		url: string;
	}

	export interface Species3 {
		name: string;
		url: string;
	}
}

export namespace EvolutionChain {
	export interface Root {
		chains: number[][];
		details: {
			[id: number]: EvolutionChainResponse.EvolutionDetail[];
		};
	}
}

export namespace Ability {
	export interface Root {
		effect_changes: any[];
		effect_entries: EffectEntry[];
		flavor_text_entries: FlavorTextEntry[];
		generation: Generation;
		id: number;
		is_main_series: boolean;
		name: string;
		names: Name[];
		pokemon: Pokemon[];
	}

	export interface EffectEntry {
		effect: string;
		language: Language;
		short_effect: string;
	}

	export interface Language {
		name: string;
		url: string;
	}

	export interface FlavorTextEntry {
		flavor_text: string;
		language: Language2;
		version_group: VersionGroup;
	}

	export interface Language2 {
		name: string;
		url: string;
	}

	export interface VersionGroup {
		name: string;
		url: string;
	}

	export interface Generation {
		name: string;
		url: string;
	}

	export interface Name {
		language: Language3;
		name: string;
	}

	export interface Language3 {
		name: string;
		url: string;
	}

	export interface Pokemon {
		is_hidden: boolean;
		pokemon: Pokemon2;
		slot: number;
	}

	export interface Pokemon2 {
		name: string;
		url: string;
	}
}

export namespace EndPointData {
	export interface Root {
		count: number;
		next: any;
		previous: any;
		results: Result[];
	}

	export interface Result {
		name: string;
		url: string;
	}
}
