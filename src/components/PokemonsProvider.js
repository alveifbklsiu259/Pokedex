import { useReducer, createContext, useContext, useEffect, useMemo } from 'react'
import { getData, getPokemons, getEndpointData, getRequiredData } from '../api';
import { getIdFromURL } from '../util';
import { useNavigateNoUpdates } from './RouterUtils';

const PokemonContext = createContext(null);
const DispatchContext = createContext(null);
const initialState = {
	language: 'en',
	pokemons: {},
	pokemonCount: null,
	nextRequest: [],
	pokemonSpecies: {},
	abilities: {},
	// loading | idle | scrolling | error 
	status: null,
	evolutionChains: {},
	searchParam: '',
	sortBy: 'numberAsc',
	advancedSearch: {
		generations: {},
		types: [],
	},
	display: [],
	allPokemonNamesAndIds: {},
	intersection: [],
	generations: {},
	types: {},
	moves: {},
	machines: {},
	// belowe are data that currently only required when language !== 'en'
	items: {},
	versions: {},
	move_damage_class: {},
	stats: {}
}

const reducer = (state, action) => {
	switch (action.type) {
		case 'languageChanged' : {
			return {
				...state, language: action.payload
			}
		}
		case 'dataLoading' : {
			return {
				...state, status: 'loading'
			}
		}
		case 'error' : {
			return {
				...state, status: 'error'
			}
		}
		case 'backToRoot' : {
			return {
				...state, status: 'idle'
			}
		}
		case 'scrolling' : {
			return {
				...state, status: 'scrolling'
			}
		}
		case 'getPokemonCount' : {
			return {
				...state, pokemonCount: action.payload
			}
		}
		case 'pokemonsLoaded' : {
			return {
				...state, pokemons: {...state.pokemons, ...action.payload.data}, status: 'idle', nextRequest: action.payload.nextRequest === 'unchanged' ? state.nextRequest : action.payload.nextRequest
			}
		}
		case 'generationLoaded' : {
			return {
				...state, status:'idle', generation: {name: action.payload.name, pokesAmount: action.payload.num},
			}
		}
		case 'pokemonSpeciesLoaded' : {
			return {
				...state, status: 'idle', pokemonSpecies: {...state.pokemonSpecies, ...action.payload}
			}
		}
		case "evolutionChainsLoaded" : {
			return {
				...state, status: 'idle', evolutionChains: {...state.evolutionChains, ...action.payload}
			}
		}
		case "searchParamChanged" : {
			return {
				...state, searchParam: action.payload
			}
		}
		case 'sortByChanged' : {
			return {
				...state, sortBy: action.payload
			}
		}
		case 'advancedSearchChanged' : {
			const {field, data} = action.payload;
			return {
				...state, advancedSearch: {...state.advancedSearch, [field]: data}
			}
		}
		case 'advancedSearchReset' : {
			return {
				...state, advancedSearch: { generations: {}, types: [] }, searchParam: ''
			}
		}
		case 'displayChanged' : {
			return {
				...state, display: action.payload, status: 'idle'
			}
		}
		case 'pokemonNamesAndIdsLoaded' : {
			return {
				...state, status: 'idle', allPokemonNamesAndIds: action.payload
			}
		}
		case 'intersectionChanged' : {
			return {
				...state, intersection: action.payload
			}
		}
		case 'nextRequestChanged' : {
			return {
				...state, nextRequest: action.payload
			}
		}
		case 'abilityLoaded' : {
			return {
				...state, status: 'idle', abilities: {...state.abilities, ...action.payload}
			}
		}
		case 'getGenerations' : {
			return {
				...state, generations: action.payload
			}
		}
		case 'getTypes' : {
			return {
				...state, types: action.payload
			}
		}
		case 'movesLoaded' : {
			return {
				...state, moves: {...state.moves, ...action.payload}
			}
		}
		case 'machineDataLoaded' : {
			const newEntities = Object.keys(action.payload).reduce((pre, cur) => {
				pre[cur] = {
					version_groups: {...state.machines[cur]?.version_groups, ...action.payload[cur].version_groups}
				};
				return pre;
			}, {});
			return {
				...state, machines: {...state.machines, ...newEntities}
			}
		}
		case 'itemLoaded' : {
			return {
				...state, items: {...state.items, ...action.payload}
			}
		}
		case 'getVersions' : {
			return {
				...state, status: 'idle', versions: action.payload
			}
		}
		case 'getMoveDamageClass' : {
			return {
				...state, move_damage_class: action.payload
			}
		}
		case 'getStats' : {
			return {
				...state, stats: action.payload
			}
		}
		default : 
			return state
	}
}

export default function PokemonsProvider({children}) {
	const [state, dispatch] = useReducer(reducer, initialState);
	useEffect(()=> {
		const getInitialPokemonData = async () => {
			let generationData, typeData;
			
			dispatch({type:'dataLoading'});
			// get pokemons count, all names and ids
			const speciesResponse = await getEndpointData('pokemon-species')
			const pokemonsNamesAndId = {};
			for (let pokemon of speciesResponse.results) {
				pokemonsNamesAndId[pokemon.name] = getIdFromURL(pokemon.url);
			};

			// set the range
			const intersection = [];
			for (let i = 1; i <= speciesResponse.count; i++) {
				intersection.push(i);
			};

			// get generations
			const generationResponse = await getEndpointData('generation');
			generationData = await getData('generation', generationResponse.results.map(entry => entry.name), 'name');

			// get types
			const typeResponse = await getEndpointData('type');
			typeData = await getData('type', typeResponse.results.map(entry => entry.name), 'name');

			// batch dispatches
			await getPokemons(dispatch, {}, pokemonsNamesAndId, intersection, 'numberAsc', 'loading');
			dispatch({type: 'getPokemonCount', payload: speciesResponse.count});
			dispatch({type: 'pokemonNamesAndIdsLoaded', payload: pokemonsNamesAndId});
			dispatch({type: 'intersectionChanged', payload: intersection});
			dispatch({type: 'getGenerations', payload: generationData});
			dispatch({type: 'getTypes', payload: typeData});
			// cache input 
			// see if i can batch dispatches between PokemonProvider and Pokemon
			// encapsulate type/generation logic
		};
			getInitialPokemonData()
	}, [dispatch]);

	// see if we can move the getInitialPokemonData out, and call it if the user lands on /pokemons/xxx
	// refresh pokemon page, there're chances that you will see dispatch being batched(normally should be two 2 loading 2 idle)
	return (
		<>
			<PokemonContext.Provider value={state}>
				<DispatchContext.Provider value={dispatch}>
					{children}
				</DispatchContext.Provider>
			</PokemonContext.Provider>
		</>
	)
}
// export function usePokemonData() {
// 	const value = useContext(PokemonContext);
// 	return useCallback(() => {
// 		return value
// 	}, [value]) 
// }
// have to call usePokemonData()()

// export function usePokemonData() {
// 	const value = useContext(PokemonContext);
// 	return useMemo(() => {
// 		return value
// 	}, [value]) 
// }


// export function usePokemonData() {
// 	// state is an object
// 	const {state} = useContext(PokemonContext);
// 	// const cachedState = useMemo(() => {state})
// 	// dispatch is the same between renders
// 	const {dispatch} = useContext(PokemonContext);
// 	const obj = {};
// 	console.log(obj)
// 	return useMemo(() => {
// 		return {state, dispatch}
// 	}, [obj])
// }

// export function usePokemonData() {
// 	const {state} = useContext(PokemonContext);
// 	const {dispatch} = useContext(PokemonContext);
// 	return useCallback(() => {
// 		return {state, dispatch}
// 	}, [state, dispatch])
// }



export function usePokemonData() {
	return useContext(PokemonContext);
};

export function useDispatchContenxt() {
	return useContext(DispatchContext)
};

// for passing cached data down the tree, so we don't have to register to reading the state value there (which will cause unnecessary re-renders), but this will make the code a bit messier, we can migrate to redux to solve this problem.
export function useCachedData(data) {
	return useMemo(() => data, [data]);
};

export function useNavigateToPokemon() {
	const navigate = useNavigateNoUpdates();
	
	const navigateToPokemon = (dispatch, requestPokemonIds, requests, state) => {
		navigate(`/pokemons/${requestPokemonIds[0]}`);
		getRequiredData(dispatch, requestPokemonIds, requests, state);
	};
	return navigateToPokemon;
}