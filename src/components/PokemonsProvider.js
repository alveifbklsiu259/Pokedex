import { useReducer, createContext, useContext, useEffect } from 'react'
import { getPokemons } from '../api';
import { getIdFromURL } from '../util';

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
}

const reducer = (state, action) => {
	switch (action.type) {
		case 'languageChanged' : {
			return {
				...state, language : action.payload
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
				...state, pokemons: {...state.pokemons, ...action.payload.data}, status:'idle', nextRequest: action.payload.nextRequest
			}
		}
		case 'generationLoaded' : {
			return {
				...state, status:'idle', generation: {name: action.payload.name, pokesAmount: action.payload.num},
			}
		}
		case 'pokemonSpeciesLoaded' : {
			return {
				...state, status: 'idle', pokemonSpecies: {...state.pokemonSpecies, [action.payload.id]: action.payload}
			}
		}
		case "evolutionChainsLoaded" : {
			return {
				...state, status: 'idle', evolutionChains: {...state.evolutionChains, [action.payload.id]: {chains: action.payload.chains, details: action.payload.details}}
			}
		}
		case "individualPokemonLoaded" : {
			return {
				...state, status: 'idle', pokemons: {...state.pokemons, [action.payload.id]: action.payload}
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
		case 'getAllPokemonNamesAndIds' : {
			return {
				...state, allPokemonNamesAndIds: action.payload
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
				...state, abilities: {...state.abilities, [action.payload.abilityKey]: action.payload.data}
			}
		}
		default : 
			return state
	}
}

export default function PokemonsProvider({children}) {
	const [state, dispatch] = useReducer(reducer, initialState);

	// can i batch dispatches in provider too?
	// see if i can batch dispatches between PokemonProvider and Pokemon

	useEffect(()=> {
		const getInitialPokemonData = async () => {
			//  either remove this dataLoading dispatch or..
			dispatch({type:'dataLoading'});
			// get pokemons amount
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/?limit=9999`);
			const data = await response.json();

			// get all names and ids
			const pokemonsNamesAndId = {};
			for (let pokemon of data.results) {
				pokemonsNamesAndId[pokemon.name] = getIdFromURL(pokemon.url);
			};

			// set the range
			const intersection = [];
			for (let i = 1; i <= data.count; i++) {
				intersection.push(i);
			};
			await getPokemons(dispatch, {}, pokemonsNamesAndId, intersection, 'numberAsc', 'loading');
			dispatch({type: 'getPokemonCount', payload: data.count});
			dispatch({type: 'getAllPokemonNamesAndIds', payload: pokemonsNamesAndId});
			dispatch({type: 'intersectionChanged', payload: intersection});
			// cache input 
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