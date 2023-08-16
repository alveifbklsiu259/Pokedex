import { createSlice, createAsyncThunk ,isAnyOf } from "@reduxjs/toolkit";
import { getPokemons } from "../../api";
import { getIdFromURL } from "../../util";
import { getPokemonsOnScroll } from "../pokemonData/pokemonDataSlice";
import { sortPokemons } from "../display/displaySlice";


const initialState = {
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
			// .addCase(searchPokemon.pending, (state, action) => {
			// 	const {searchParam, selectedGenerations, selectedTypes} = action.meta.arg;
			// 	state.advancedSearch.generations = selectedGenerations || state.advancedSearch.generations;
			// 	state.advancedSearch.types = selectedTypes || state.advancedSearch.types;
			// 	state.searchParam = searchParam;
			// 	// reset table info
			// 	state.tableInfo.page = 1;
			// 	state.tableInfo.selectedPokemonId = null;
			// })
			.addCase(searchPokemon.fulfilled, (state, action) => {
				const {searchParam, selectedGenerations, selectedTypes} = action.payload;
				state.advancedSearch.generations = selectedGenerations || state.advancedSearch.generations;
				state.advancedSearch.types = selectedTypes || state.advancedSearch.types;
				state.searchParam = searchParam;
			})
			
			// may be have a common reducer taht update states that fall in addMatcher?


	}
});

export const searchPokemon = createAsyncThunk('search/searchPokemon', async ({searchParam, selectedGenerations, selectedTypes, matchMethod}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	const allNamesAndIds = pokeData.allPokemonNamesAndIds;
	const pokemonNames = Object.keys(allNamesAndIds);
	// get range
	let pokemonRange = [];

	if (!selectedGenerations || Object.keys(selectedGenerations).length === 0) {
		for (let i = 0; i < pokemonNames.length; i ++) {
			let obj = {};
			obj.name = pokemonNames[i];
			obj.url = `https://pokeapi.co/api/v2/pokemon-species/${allNamesAndIds[pokemonNames[i]]}/`
			pokemonRange.push(obj);
		};
	} else {
		pokemonRange = Object.values(selectedGenerations).flat();
	};

	// handle search param
	const trimmedText = searchParam.trim();
	let searchResult = [];
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
	const rangeIds = searchResult.map(pokemon => getIdFromURL(pokemon.url));
	let intersection = rangeIds;

	// handle types
	if (selectedTypes?.length) {
		if (matchMethod === 'all') {
			const typeMatchingArray = selectedTypes.reduce((pre, cur) => {
				pre.push(pokeData.types[cur].pokemon.map(entry => getIdFromURL(entry.pokemon.url)));
				return pre;
			}, []);
			for (let i = 0; i < typeMatchingArray.length; i ++) {
				intersection = intersection.filter(pokemon => typeMatchingArray[i].includes(pokemon));
			};
		} else if (matchMethod === 'part') {
			const typeMatchingPokemonIds = selectedTypes.reduce((pre, cur) => {
				pokeData.types[cur].pokemon.forEach(entry => pre.push(getIdFromURL(entry.pokemon.url)));
				return pre;
			}, []);
			intersection = rangeIds.filter(id => typeMatchingPokemonIds.includes(id));
		};
	};
	const {fetchedPokemons, pokemonsToDisplay, nextRequest} = await getPokemons(pokeData.pokemons, allNamesAndIds, dispatch, intersection, pokeData.sortBy);
	return {intersection, searchParam, selectedGenerations, selectedTypes, fetchedPokemons, nextRequest, pokemonsToDisplay};
});






export default searchSlice.reducer;

export const {advancedSearchReset} = searchSlice.actions;

export const selectSearchParam = state => state.search.searchParam;
export const selectAdvancedSearch = state => state.search.advancedSearch;