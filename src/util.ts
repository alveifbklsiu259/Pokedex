import type { Pokemon, PokemonSpecies } from "../typeModule";
import type { LanguageOption } from "./features/display/displaySlice";
import type { EndPointRequest } from "./api";

export function getIdFromURL<T extends string | undefined>(url: T): T extends string ? number : undefined;
export function getIdFromURL(url: string | undefined): number | undefined {
	return url ? Number(url.slice(url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1, url.lastIndexOf('/'))) : undefined;
};

export function transformToKeyName<T extends string | undefined>(name: T): T extends string ? string : undefined;
export function transformToKeyName(name: string | undefined): string | undefined {
	return name ? name.replaceAll('-', '_') : undefined;
};

export function transformToDash<T extends string | undefined>(name: T): T extends string ? string : undefined;
export function transformToDash (name: string | undefined): string | undefined {
	return name ? name.replaceAll('_', '-') : undefined;
};

type NameInstance = PokemonSpecies.Name

type NameEntries = {
	names: NameInstance[],
	form_names?: NameInstance[]
} | undefined

type GetNameByLanguage = {
	(defaultName: string, language: LanguageOption, entries: NameEntries | undefined): string
}
export const getNameByLanguage: GetNameByLanguage = (defaultName, language, entries) => {
	if (!entries) {
		return defaultName;
	} else {
		const getMatchName = (lang: typeof language | 'ja-Hrkt') => (entries['form_names'] || entries.names).find(entry => entry.language.name === transformToDash(lang))?.name;
		return getMatchName(language) ? getMatchName(language)! : language === 'ja' ? getMatchName('ja-Hrkt') || defaultName : defaultName;
	};
};

export const getFormName = (speciesData: PokemonSpecies.Root | undefined, language: LanguageOption, pokemonData: Pokemon.Root) => {
	let pokemonName = getNameByLanguage(pokemonData.name, language, speciesData);
	let formName: string;

	if (!pokemonData.is_default) {
		if (pokemonData.formData) {
			formName = getNameByLanguage(pokemonData.formData.form_name, language, pokemonData.formData);
		} else {
			formName = pokemonData.name;
		};
		
		if (formName.toLowerCase().includes(pokemonName.toLowerCase())) {
			pokemonName = formName;
		} else {
			pokemonName = pokemonName.concat(`(${formName})`);
		};
	};
	return pokemonName;
};

type Version = {
	name: string,
	url: string
}

type BaseEntry = {
	language: {
		name: string,
		url: string
	},
};

type FlavorTextInstance = BaseEntry & {
	flavor_text: string,
	version?: Version
	version_group?: Version
}

type EffectInstance = BaseEntry & {
	effect: string
}

export function getTextByLanguage<T extends FlavorTextInstance | EffectInstance>(language: LanguageOption, entries: T[], dataType: Extract<keyof T, 'flavor_text' | 'effect'>, version?: T extends FlavorTextInstance ? string : never): string {
	let result: string = '';
	const getText = (language: LanguageOption): string | undefined => {
		const ignoreVersion = entries.find(entry => entry.language.name === transformToDash(language))?.[dataType] as string | undefined;
		
		if (version) {
			return (entries).find(entry => entry.language.name === transformToDash(language) && (entry as FlavorTextInstance)?.version_group?.name === version)?.[dataType] as string | undefined || ignoreVersion;
		} else {
			return ignoreVersion;
		};
	};
	result = getText(language) || getText('en') || 'No Data To Show';

	if (language === 'ja' || language === 'zh_Hant' || language === 'zh_Hans') {
		result = result?.replace(/　|\n/g, '');
	};

	return result;
};

export function toEndPointString(str: EndPointRequest) {
	let endPointString: string = '';
	const characters = str.split('');
	for (let i = 0; i < characters.length; i++ ) {
		if (characters[i] !== '-' && characters[i] === characters[i].toUpperCase()) {
			endPointString += `-${characters[i].toLowerCase()}`
		} else {
			endPointString += characters[i];
		};
	};
	return endPointString;
};