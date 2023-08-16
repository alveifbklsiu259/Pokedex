import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { getIdFromURL, getNameByLanguage, transformToKeyName } from "../../util";
import { getAllSpecies, getRequiredData, getPokemons } from "../../api";
import { getInitialData, getPokemonsOnScroll, getRequiredDataThunk } from "../pokemonData/pokemonDataSlice";
import { searchPokemon } from "../search/searchSlice";


const initialState = {
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
}

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
		tableInfoChanged: (state, action) => {
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
			// thunks from other slices
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
				// did we change intersection before separating slices?

				// reset table info
				state.tableInfo.page = 1;
				state.tableInfo.selectedPokemonId = null;
			})




			// end thunks from other slices
			// .addMatcher(isAnyOf(sortPokemons.fulfilled, searchPokemon.fulfilled, getPokemonsOnScroll.fulfilled), (state, action) => {
			// 	const {fetchedPokemons,	nextRequest, pokemonsToDisplay } = action.payload;
			// 	state.pokemons = fetchedPokemons ? {...state.pokemons, ...fetchedPokemons} : state.pokemons;
			// 	state.nextRequest = nextRequest;
			// 	state.display = pokemonsToDisplay;
			// 	state.status = 'idle';
			// })
			.addMatcher(isAnyOf(sortPokemons.fulfilled, searchPokemon.fulfilled, getPokemonsOnScroll.fulfilled), (state, action) => {
				const {nextRequest, pokemonsToDisplay} = action.payload;
				state.nextRequest = nextRequest;
				state.display = pokemonsToDisplay;
				state.status = 'idle';
			})

			// we can move status idle to their own fulfilled reducer, and add getRequiredData, then we can remove this addMatcher
			.addMatcher(isAnyOf(getRequiredDataThunk.fulfilled, changeViewMode.fulfilled, changeLanguage.fulfilled), (state, action) => {
				// const {fetchedData} = action.payload;
				// const keys = Object.keys(fetchedData);
				// if (keys.length) {
				// 	keys.forEach(key => {
				// 		switch(key) {
				// 			case 'evolutionChains' : {
				// 				const [chainData, fetchedPokemons] = fetchedData[key];
				// 				state[key] = {...state[key], ...chainData};
				// 				if (Object.keys(fetchedPokemons)) {
				// 					state.pokemons = {...state.pokemons, ...fetchedPokemons}
				// 				};
				// 				break;
				// 			}
				// 			default : 
				// 				state[transformToKeyName(key)] = {...state[transformToKeyName(key)], ...fetchedData[key]};
				// 		};
				// 	});
				// };

				// change viewMode, sort, search pokemon, change to cards, not sync
				state.status = 'idle';
			})
	}
});

export const changeLanguage = createAsyncThunk('display/changeLanguage', async({option: language, pokeId}, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	const dispalyData = getState().display;
	if (dispalyData.status === 'idle') {
		let fetchedSpecies;
		const hasAllSpecies = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;
	
		const requests = pokeId ? ['pokemons', 'abilities', 'items', 'version', 'move-damage-class', 'stat'] : ['version', 'move-damage-class', 'stat'];
		const requestPokemonIds = pokeId ? pokeData.pokemonSpecies[getIdFromURL(pokeData.pokemons[pokeId].species.url)].varieties.map(variety => getIdFromURL(variety.pokemon.url)) : [undefined];
	
		if (!hasAllSpecies) {
			// the reason why I decide to dispatch dataLoading here instead of passing the dispatch down to getAllSpecies like some other functions(getRequiredData, getPokemons) is because that it requires some effors to check if the fecth is needed, but right here I already know that.
			dispatch(dataLoading());
			fetchedSpecies = await getAllSpecies(pokeData.pokemonSpecies, pokeData.pokemonCount);
		};
	
		const fetchedData = await getRequiredData(pokeData, dispatch, requestPokemonIds, requests, language);
		
		const newNamesIds = Object.values({...pokeData.pokemonSpecies, ...fetchedSpecies}).reduce((pre, cur) => {
			pre[getNameByLanguage(cur.name, language, cur)] = cur.id;
			return pre;
		}, {});
		
		return {fetchedData, fetchedSpecies, newNamesIds, language};
	} else {
		return rejectWithValue('multiple requests while data is loading');
	};
});

export const sortPokemons = createAsyncThunk('display/sortPokemons', async(sortOption, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	const displayData = getState().display

	if (displayData.status === 'idle') {
		const res = await getPokemons(pokeData.pokemons, pokeData.allPokemonNamesAndIds, dispatch, displayData.intersection, sortOption);
		return res;
	} else {
		// prevent fulfilled reducer function from runing.
		return rejectWithValue('multiple requests while data is loading');
	};
});

export const changeViewMode = createAsyncThunk('display/changeViewMode', async({requestPokemonIds, requests, viewMode}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	const displayData = getState().display

	let fetchedData = {};
	if (displayData.status === 'idle') {
		// prevent multiple fetches, I don't want to listen for status in the ViewMode component, else when scrolling, ViewMode will re-render.
		const isAllSpeciesCached = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;
		const isAllPokemonsCached = isAllSpeciesCached ? Object.keys(pokeData.pokemonSpecies).every(id => pokeData.pokemons[id]) : false;
		if (!isAllSpeciesCached || !isAllPokemonsCached) {
			fetchedData = await getRequiredData(getState().pokeData, dispatch, requestPokemonIds, requests, displayData.language);
		};
	};
	return {fetchedData, viewMode};
});




export const {dataLoading, backToRoot, tableInfoChanged, error, scrolling, sortByChange} = displaySlice.actions;

export default displaySlice.reducer;


export const selectLanguage = state => state.display.language;
export const selectSortBy = state => state.display.sortBy;
export const selectViewMode = state => state.display.viewMode;
export const selectStatus = state => state.display.status;
export const selectDisplay = state => state.display.display;
export const selectNextRequest = state => state.display.nextRequest;
export const selectIntersection = state => state.display.intersection;
export const selectTableInfo = state => state.display.tableInfo;