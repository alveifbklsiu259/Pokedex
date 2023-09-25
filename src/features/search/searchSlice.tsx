import { createSlice } from "@reduxjs/toolkit";
import { createAppAsyncThunk } from "../../app/hooks";
import { getPokemons } from "../../api";
import { getIdFromURL } from "../../util";
import type { RootState } from "../../app/store";

export type SelectedGenerations = {
	[name: string]: {
		name: string,
		url: string
	}[]
};

export type SelectedTypes = string[];

type SearchType = {
	searchParam: string
	advancedSearch: {
		generations: SelectedGenerations
		types: SelectedTypes
	}
};

const initialState: SearchType = {
	searchParam: '',
	advancedSearch: {
		generations: {},
		types: [],
	},
};

const searchSlice = createSlice({
	name: 'search',
	initialState,
	reducers: {
		advancedSearchReset: state => {
			if (state.advancedSearch.types.length) {
				state.advancedSearch.types = [];
			};
			if (Object.keys(state.advancedSearch.generations).length) {
				state.advancedSearch.generations = {};
			};
			state.searchParam = '';
		},
		// searchParamChanged: (state, action) => {
		// 	state.searchParam = action.payload;
		// },
		// advancedSearchChanged: (state, action) => {
		// 	const {field, data} = action.payload;
		// 	state.advancedSearch = {...state.advancedSearch, [field]: data};
		// },
	},
	extraReducers: builder => {
		builder
			.addCase(searchPokemon.fulfilled, (state, action) => {
				const {searchParam, selectedGenerations, selectedTypes} = action.payload;
				state.advancedSearch.generations = selectedGenerations || state.advancedSearch.generations;
				state.advancedSearch.types = selectedTypes || state.advancedSearch.types;
				state.searchParam = searchParam;
			})
	}
});

type SearchPokemonParamsType = {
	searchParam: string,
	selectedGenerations?: SelectedGenerations,
	selectedTypes?: SelectedTypes,
	matchMethod?: 'all' | 'part'
}

export const searchPokemon = createAppAsyncThunk('search/searchPokemon', async({searchParam, selectedGenerations, selectedTypes, matchMethod}: SearchPokemonParamsType, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	const dispalyData = getState().display;
	const allNamesAndIds = pokeData.allPokemonNamesAndIds;

	// get range
	let pokemonRange: {
		name: string,
		url: string
	}[] = [];
	// when searching in error page, selectedGenerations will be undefined.
	if (!selectedGenerations || Object.keys(selectedGenerations).length === 0) {
		pokemonRange = Object.values(pokeData.generation).map(gen => gen.pokemon_species).flat();
	} else {
		pokemonRange = Object.values(selectedGenerations).flat();
	};
	// handle search param
	const trimmedText = searchParam.trim();
	let searchResult: typeof pokemonRange = [];
	if (trimmedText === '') {
		// no input or only contains white space(s)
		searchResult = pokemonRange;
	} else if (isNaN(Number(trimmedText))) {
		// sort by name
		searchResult = pokemonRange.filter(pokemon => pokemon.name.toLowerCase().includes(trimmedText.toLowerCase()));
	} else {
		// sort by id
		searchResult = pokemonRange.filter(pokemon => String(getIdFromURL(pokemon.url)).padStart(4 ,'0').includes(String(trimmedText)));
	};

	// get intersection
	let intersection = searchResult.map(pokemon => getIdFromURL(pokemon.url));

	// handle types
	if (selectedTypes?.length) {
		if (matchMethod === 'all') {

			// can we be more specific , use literal type here?
			const typeMatchingArray = selectedTypes.reduce((pre: number[][], cur) => {
				pre.push(pokeData.type[cur].pokemon.map(entry => getIdFromURL(entry.pokemon.url)));
				return pre;
			}, []);
			for (let i = 0; i < typeMatchingArray.length; i ++) {
				intersection = intersection.filter(pokemon => typeMatchingArray[i].includes(pokemon));
			};
		} else if (matchMethod === 'part') {
			const typeMatchingPokemonIds = selectedTypes.reduce((pre: number[], cur) => {
				pokeData.type[cur].pokemon.forEach(entry => pre.push(getIdFromURL(entry.pokemon.url)));
				return pre;
			}, []);
			intersection = intersection.filter(id => typeMatchingPokemonIds.includes(id));
		};
	};
	const {fetchedPokemons, pokemonsToDisplay, nextRequest} = await getPokemons(pokeData.pokemon, allNamesAndIds, dispatch, intersection, dispalyData.sortBy);
	return {intersection, searchParam, selectedGenerations, selectedTypes, fetchedPokemons, nextRequest, pokemonsToDisplay};
});

export default searchSlice.reducer;

export const {advancedSearchReset} = searchSlice.actions;

export const selectSearchParam = (state: RootState) => state.search.searchParam;
export const selectAdvancedSearch = (state: RootState) => state.search.advancedSearch;