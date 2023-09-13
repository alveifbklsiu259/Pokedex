import type { Ability, PokemonData, SpeciesData } from "../typeModule";
import type { LanguageOptions } from "./features/display/displaySlice";

type NameInstance = SpeciesData.Name

type NameEntries = {
	names: NameInstance[],
	form_names?: NameInstance[]
} | undefined

export function getIdFromURL(url: undefined): undefined;
export function getIdFromURL(url: string): number;
export function getIdFromURL(url: string | undefined): number | undefined;
export function getIdFromURL(url: string | undefined): number | undefined {
	return url ? Number(url.slice(url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1, url.lastIndexOf('/'))) : undefined;
};

export function transformToKeyName(name: string): string;
export function transformToKeyName(name: undefined): undefined;
export function transformToKeyName(name: string | undefined): string | undefined {
	return name ? name.replaceAll('-', '_') : undefined;
};

// export function transformToKeyName2<T extends string | undefined>(name: T): T {
// 	return name ? name.replaceAll('-', '_') as T : undefined as T
// }

export function transformToDash(name: string): string;
export function transformToDash(name: undefined): undefined;
export function transformToDash (name: string | undefined): string | undefined {
	return name ? name.replaceAll('_', '-') : undefined;
};

type GetNameByLanguage = {
	(defaultName: string, language: LanguageOptions, entries: NameEntries): string | undefined
}

export const getNameByLanguage: GetNameByLanguage = (defaultName, language, entries) => {
	if (!entries) {
		return defaultName;
	} else {
		const getMatchName = (lang: string) => (entries['form_names'] || entries.names).find(entry => entry.language.name === transformToDash(lang))?.name;
		return getMatchName(language) ? getMatchName(language) : language === 'ja' ? getMatchName('ja-Hrkt') || defaultName : defaultName;
	};
};

export const getFormName = (speciesData: SpeciesData.Root, language: LanguageOptions, pokemonData: PokemonData.Root) => {
	let pokemonName = getNameByLanguage(pokemonData.name, language, speciesData)!;
	if (!pokemonData.is_default) {
		let formName: ReturnType<typeof getNameByLanguage>;
		if (pokemonData.formData) {
			formName = getNameByLanguage(pokemonData.formData.form_name, language, pokemonData.formData);
			if (formName) {
				if (formName.includes(pokemonName)) {
					pokemonName = formName;
				} else {
					pokemonName = pokemonName.concat(`(${formName})`);
				};
			};
		};
	};
	return pokemonName;
};

type FlavorTextInstance = Ability.FlavorTextEntry;
type EffectInstance = Ability.EffectEntry;

// export const getTextByLanguage = (language: LanguageOptions, entries: TextEntries, dataType: 'effect' | 'flavor_text', version? : string | undefined): string=> {
// 	let result: string = '';

// 	const getResult = (language: LanguageOptions): string | undefined => {
// 		const ignoreVersion = entries?.find(entry => entry?.language?.name === transformToDash(language))?.[dataType as keyof TextEntries[number]];
// 		if (version) {
// 			return entries.find(entry => entry.language.name === transformToDash(language) && entry?.version_group?.name === version)?.[dataType as keyof TextEntries[number]] || ignoreVersion;
// 		} else {
// 			return ignoreVersion;
// 		};
// 	};
// 	result = getResult(language) || getResult('en');

// 	if (language === 'ja' || language === 'zh_Hant' || language === 'zh_Hans') {
// 		result = result?.replace(/　|\n/g, '');
// 	};

// 	return result || 'No Data To Show';
// };




export function getTextByLanguage(language: LanguageOptions, entries: FlavorTextInstance[], dataType: 'flavor_text'): string;
export function getTextByLanguage(language: LanguageOptions, entries: EffectInstance[], dataType: 'effect'): string;
export function getTextByLanguage(language: LanguageOptions, entries: (FlavorTextInstance | EffectInstance)[], dataType: 'flavor_text' | 'effect', version?: string): string;
export function getTextByLanguage(language: LanguageOptions, entries: (FlavorTextInstance | EffectInstance)[], dataType: 'flavor_text' | 'effect', version? : string): string {
	let result: string = '';
	const getResult = (language: LanguageOptions): string | undefined => {
		const ignoreVersion = entries.find(entry => entry.language.name === transformToDash(language))?.[dataType as keyof (FlavorTextInstance | EffectInstance)];
		
		if (version) {
			return entries.find(entry => entry.language.name === transformToDash(language) && entry?.version_group?.name === version)?.[dataType as keyof (FlavorTextInstance | EffectInstance)] || ignoreVersion;
		} else {
			return ignoreVersion;
		};
	};
	result = getResult(language) || getResult('en');

	if (language === 'ja' || language === 'zh_Hant' || language === 'zh_Hans') {
		result = result?.replace(/　|\n/g, '');
	};

	return result || 'No Data To Show';
};