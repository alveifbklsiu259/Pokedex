import { PayloadAction, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { getIdFromURL, getNameByLanguage } from "../../util";
import { getAllSpecies, getRequiredData, getPokemons } from "../../api";
import { GetRequiredData, getInitialData, getPokemonsOnScroll, getRequiredDataThunk, type CachedAllPokemonNamesAndIds } from "../pokemonData/pokemonDataSlice";
import { searchPokemon } from "../search/searchSlice";
import type { RootState } from "../../app/store";
import { createAppAsyncThunk } from "../../app/hooks";
import { sortOptions } from "./Sort";
import { languageOptions } from "./LanguageMenu";
import { TableInfoRefTypes } from "../pokemonData/Pokemons";

export type SortOption = typeof sortOptions[number]['value'];
export type LanguageOption = keyof typeof languageOptions;

export type DisplayType = {
	display: number[],
	intersection: number[],
	viewMode: 'module' | 'list',
	language: LanguageOption,
	nextRequest: number[] | null,
	sortBy: SortOption
	status: null | 'idle' | 'loading' | 'scrolling' | 'error'
	tableInfo: {
		page: number,
		rowsPerPage: number,
		// for scroll restoration
		selectedPokemonId: null | number
	}
}

const initialState: DisplayType = {
	display: [],
	intersection: [],
	viewMode: 'module',
	language: 'en',
	nextRequest: [],
	sortBy: 'numberAsc',
	status: null,
	tableInfo: {
		page: 1,
		rowsPerPage: 10,
		// for scroll restoration
		selectedPokemonId: null
	}
};

const displaySlice = createSlice({
	name: 'display',
	initialState,
	reducers: {
		dataLoading: state => {
			state.status = 'loading';
		},
		backToRoot: state => {
			state.status = 'idle';
		},
		tableInfoChanged: (state, action: PayloadAction<TableInfoRefTypes & {selectedPokemonId: null | number}>) => {
			state.tableInfo = {...state.tableInfo, ...action.payload};
		},
		error: state => {
			state.status = 'error'
		},
		scrolling: state => {
			state.status = 'scrolling'
		},
		sortByChange: (state, action) => {
			state.sortBy = action.payload;
		},
	},
	extraReducers: builder => {
		builder
			.addCase(changeLanguage.fulfilled, (state, action) => {
				const {language} = action.payload;
				state.language = language;
			})
			.addCase(sortPokemons.pending, (state, action) => {
				// change UI before data is fetched.
				if (state.status === 'idle') {
					const sortBy = action.meta.arg;
					state.sortBy = sortBy;
				};
			})
			.addCase(changeViewMode.pending, (state, action) => {
				// change UI before data is fetched and prevent buttons from being clicked when there's data being fetched.
				if (state.status === 'idle') {
					const {viewMode} = action.meta.arg;
					state.viewMode = viewMode;
				};
			})
			.addCase(getInitialData.pending, state => {
				state.status = 'loading';
			})
			.addCase(getInitialData.fulfilled, (state, action) => {
				const {intersection, nextRequest, pokemonsToDisplay} = action.payload;
				return {
					...state,
					intersection: intersection,
					nextRequest: nextRequest,
					display: pokemonsToDisplay,
					status: 'idle'
				};
			})
			.addCase(searchPokemon.fulfilled, (state, action) => {
				const {intersection} = action.payload;
				state.intersection = intersection

				// reset table info
				state.tableInfo.page = 1;
				state.tableInfo.selectedPokemonId = null;
			})
			.addMatcher(isAnyOf(sortPokemons.fulfilled, searchPokemon.fulfilled, getPokemonsOnScroll.fulfilled), (state, action) => {
				const {nextRequest, pokemonsToDisplay} = action.payload;
				state.nextRequest = nextRequest;
				state.display = pokemonsToDisplay;
				state.status = 'idle';
			})
			.addMatcher(isAnyOf(getRequiredDataThunk.fulfilled, changeViewMode.fulfilled, changeLanguage.fulfilled), state => {
				state.status = 'idle';
			})
	}
});

type ChangeLanguageParamTypes = {
	option: LanguageOption,
	pokeId: string | undefined
};

export const changeLanguage = createAppAsyncThunk('display/changeLanguage', async({option: language, pokeId}: ChangeLanguageParamTypes, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	const dispalyData = getState().display;
	// I didn't disable the button from being clicked when status === 'loading', because it would cause LanguageMenu to re-render when status changes, by adding the below condition we can basically achieve the same thing.
	// another workaround is to extract the button to a separate component, and listens for the status in the button component, the button component will re-render when status changes, but it would be quite cheap to re-render.
	
	if (dispalyData.status !== 'loading') { // error | idle
		let fetchedSpecies: Awaited<ReturnType<typeof getAllSpecies>> | undefined;
		let id = pokeId;
		let requests: GetRequiredData.Request[];
		let requestPokemonIds: number[];
		const hasAllSpecies = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount!;
		
		// user may directly search pokemon in url bar using pokemon name
		if (id && isNaN(Number(id))) {
			// allPokemonNamesAndIds may not store english names.
			id = String(pokeData.allPokemonNamesAndIds[id.toLowerCase()] || Object.values(pokeData.pokemon).find(pokemon => pokemon.name.toLowerCase() === id!.toLowerCase())?.id);
		} else if (id && Number(id) > pokeData.pokemonCount!) {
			id = 'undefined';
		};
		if (id && id !== 'undefined') {
			requests = ['pokemon', 'ability', 'item', 'version', 'moveDamageClass', 'stat'];
			requestPokemonIds = pokeData.pokemonSpecies[getIdFromURL(pokeData.pokemon[id!].species.url)].varieties.map(variety => getIdFromURL(variety.pokemon.url));
		} else {
			requests = ['version', 'moveDamageClass', 'stat'];
			requestPokemonIds = [];
		};

		if (!hasAllSpecies) {
			// the reason why I decide to dispatch dataLoading here instead of passing the dispatch down to getAllSpecies like some other functions(getRequiredData, getPokemons) is because that it requires some effors to check if the fecth is needed, but right here I already know that.
			dispatch(dataLoading());
			fetchedSpecies = await getAllSpecies(pokeData.pokemonSpecies, pokeData.pokemonCount!);
		};
		const fetchedData = await getRequiredData(pokeData, requestPokemonIds, requests, language, dispatch);
		
		const newNamesIds: CachedAllPokemonNamesAndIds = Object.values({...pokeData.pokemonSpecies, ...fetchedSpecies}).reduce<CachedAllPokemonNamesAndIds>((pre, cur) => {
			// some newly added pokemon in the API may only contain english name, in this case, exclude it.
			const nameByLanguage = getNameByLanguage(cur.name, language, cur).toLowerCase();
			if ((language !== 'en' && nameByLanguage !== cur.name) || language === 'en') {
				pre[nameByLanguage] = cur.id;
			};
			return pre;
		}, {});
		return {fetchedData, fetchedSpecies, newNamesIds, language};
	} else {
		// prevent fulfilled reducer function from runing.
		return rejectWithValue('multiple requests while data is loading');
	};
});

export const sortPokemons = createAppAsyncThunk('display/sortPokemons', async(sortOption: SortOption, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	const displayData = getState().display

	if (displayData.status === 'idle') {
		const res = await getPokemons(pokeData.pokemon, pokeData.allPokemonNamesAndIds, dispatch, displayData.intersection, sortOption);
		return res;
	} else {
		return rejectWithValue('multiple requests while data is loading');
	};
});

type ChangeViewModeParamTypes = {
	viewMode: "list" | "module"
};

export const changeViewMode = createAppAsyncThunk('display/changeViewMode', async({viewMode}: ChangeViewModeParamTypes, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	const displayData = getState().display

	let fetchedData: Awaited<ReturnType<typeof getRequiredData>> | undefined;
	// prevent multiple fetches, I don't want to listen for status in the ViewMode component, else when scrolling ViewMode will re-render.
	if (displayData.status === 'idle') {
		if (viewMode === 'list') {
			const isAllSpeciesCached = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;
			const isAllPokemonsCached = isAllSpeciesCached ? Object.keys(pokeData.pokemonSpecies).every(id => pokeData.pokemon[id]) : false;
			if (!isAllSpeciesCached || !isAllPokemonsCached) {
				const requestPokemonIds: number[] = [];
				for (let i = 1; i <= pokeData.pokemonCount!; i ++) {
					requestPokemonIds.push(i);
				};
				fetchedData = await getRequiredData(getState().pokeData, requestPokemonIds, ['pokemon', 'pokemonSpecies'], displayData.language, dispatch);
			};
		};
		return {fetchedData, viewMode};
	} else {
		return rejectWithValue('multiple requests while data is loading');
	};
});

export default displaySlice.reducer;
export const {dataLoading, backToRoot, tableInfoChanged, error, scrolling, sortByChange} = displaySlice.actions;

export const selectLanguage = (state: RootState) => state.display.language;
export const selectSortBy = (state: RootState) => state.display.sortBy;
export const selectViewMode = (state: RootState) => state.display.viewMode;
export const selectStatus = (state: RootState) => state.display.status;
export const selectDisplay = (state: RootState) => state.display.display;
export const selectNextRequest = (state: RootState) => state.display.nextRequest;
export const selectIntersection = (state: RootState) => state.display.intersection;
export const selectTableInfo = (state: RootState) => state.display.tableInfo;