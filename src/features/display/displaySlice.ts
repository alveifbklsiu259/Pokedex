import { PayloadAction, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { getIdFromURL, getNameByLanguage } from "../../util";
import { getAllSpecies, getRequiredData, getPokemons } from "../../api";
import { RequiredDataTypes, getInitialData, getPokemonsOnScroll, getRequiredDataThunk, type PokemonNamesAndIds } from "../pokemonData/pokemonDataSlice";
import { searchPokemon } from "../search/searchSlice";
import type { RootState } from "../../app/store";
import { createAppAsyncThunk } from "../../app/hooks";
import type { TableInfoRefProps } from "./ViewMode";

export type SortOptions = 'numberAsc' | 'numberDesc' | 'nameAsc' | 'nameDesc' | 'heightAsc' | 'heightDesc' | 'weightAsc' | 'weightDesc' | 'totalDesc' | 'totalAsc' | 'attackDesc' | 'attackAsc' | 'hpDesc' | 'hpAsc' | 'defenseDesc' | 'defenseAsc' | 'special-attackDesc' | 'special-attackAsc' | 'special-defenseDesc' | 'special-defenseAsc' | 'speedDesc' | 'speedAsc';

export type LanguageOptions = 'en' | 'ja' | 'zh_Hant' | 'zh_Hans' | 'ko' | 'fr' | 'de';

export type DisplayType = {
	display: number[],
	intersection: number[],
	viewMode: 'module' | 'list',
	language: LanguageOptions,
	nextRequest: number[] | null,
	sortBy: SortOptions
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
		tableInfoChanged: (state, action: PayloadAction<TableInfoRefProps & {selectedPokemonId: null | number}>) => {
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
			.addCase(changeLanguage.fulfilled, (state, {payload}) => {
				const {language} = payload;
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
	option: DisplayType['language'],
	pokeId: string | undefined
};

export const changeLanguage = createAppAsyncThunk('display/changeLanguage', async({option: language, pokeId}: ChangeLanguageParamTypes, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	console.log(pokeData)
	const dispalyData = getState().display;
	console.log(pokeData)
	// I didn't disable the button from being clicked when status === 'loading', because it would cause LanguageMenu to re-render when status changes, by adding the below condition we can basically achieve the same thing.
	// another workaround is to extract the button to a separate component, and listens for the status in the button component, the button component will re-render when status changes, but it would be quite cheap to re-render.
	
	if (dispalyData.status === 'idle') {
		let fetchedSpecies: Awaited<ReturnType<typeof getAllSpecies>> | undefined;
		let newPokeId: typeof pokeId | number = pokeId;
		const hasAllSpecies = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;
		
		// user may directly search pokemon in url bar using pokemon name
		if (pokeId && isNaN(Number(pokeId))) {
			newPokeId = pokeData.allPokemonNamesAndIds[pokeId.toLowerCase()] || Object.values(pokeData.pokemons).find(pokemon => pokemon.name.toLowerCase() === pokeId.toLowerCase())?.id || pokeId;
		};

		const requests: RequiredDataTypes.RequiredDataRequest[] = newPokeId ? ['pokemons', 'abilities', 'items', 'version', 'move-damage-class', 'stat'] : ['version', 'move-damage-class', 'stat'];
		const requestPokemonIds = newPokeId ? pokeData.pokemonSpecies[getIdFromURL(pokeData.pokemons[newPokeId].species.url)].varieties.map(variety => getIdFromURL(variety.pokemon.url)) : [undefined];
	
		if (!hasAllSpecies) {
			// the reason why I decide to dispatch dataLoading here instead of passing the dispatch down to getAllSpecies like some other functions(getRequiredData, getPokemons) is because that it requires some effors to check if the fecth is needed, but right here I already know that.
			dispatch(dataLoading());
			fetchedSpecies = await getAllSpecies(pokeData.pokemonSpecies, pokeData.pokemonCount as number);
		};
		const fetchedData = await getRequiredData(pokeData, dispatch, requestPokemonIds, requests, language);
		const newNamesIds: PokemonNamesAndIds = Object.values({...pokeData.pokemonSpecies, ...fetchedSpecies}).reduce((pre: PokemonNamesAndIds, cur) => {
			pre[getNameByLanguage(cur.name, language, cur)!] = cur.id;
			return pre;
		}, {});
		
		return {fetchedData, fetchedSpecies, newNamesIds, language};
	} else {
		// prevent fulfilled reducer function from runing.
		return rejectWithValue('multiple requests while data is loading');
	};
});

export const sortPokemons = createAppAsyncThunk('display/sortPokemons', async(sortOption: SortOptions, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	const displayData = getState().display

	if (displayData.status === 'idle') {
		const res = await getPokemons(pokeData.pokemons, pokeData.allPokemonNamesAndIds, dispatch, displayData.intersection, sortOption);
		return res;
	} else {
		return rejectWithValue('multiple requests while data is loading');
	};
});

type ChangeViewModeParamTypes = {
	requestPokemonIds: number[]
	requests: RequiredDataTypes.RequiredDataRequest[]
	viewMode: "list" | "module"
};

export const changeViewMode = createAppAsyncThunk('display/changeViewMode', async({requestPokemonIds, requests, viewMode}: ChangeViewModeParamTypes, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	const displayData = getState().display

	let fetchedData: Awaited<ReturnType<typeof getRequiredData>> | undefined;
	if (displayData.status === 'idle') {
		// prevent multiple fetches, I don't want to listen for status in the ViewMode component, else when scrolling, ViewMode will re-render.
		const isAllSpeciesCached = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;
		const isAllPokemonsCached = isAllSpeciesCached ? Object.keys(pokeData.pokemonSpecies).every(id => pokeData.pokemons[id]) : false;
		if (!isAllSpeciesCached || !isAllPokemonsCached) {
			fetchedData = await getRequiredData(getState().pokeData, dispatch, requestPokemonIds, requests, displayData.language);
		};
	return {fetchedData, viewMode};
	} else {
		return rejectWithValue('multiple requests while data is loading');
	};
});

export default displaySlice.reducer;
export const {dataLoading, backToRoot, tableInfoChanged, error, scrolling, sortByChange} = displaySlice.actions;

export const selectLanguage =(state: RootState) => state.display.language;
export const selectSortBy =(state: RootState) => state.display.sortBy;
export const selectViewMode =(state: RootState) => state.display.viewMode;
export const selectStatus =(state: RootState) => state.display.status;
export const selectDisplay =(state: RootState) => state.display.display;
export const selectNextRequest =(state: RootState) => state.display.nextRequest;
export const selectIntersection =(state: RootState) => state.display.intersection;
export const selectTableInfo =(state: RootState) => state.display.tableInfo;