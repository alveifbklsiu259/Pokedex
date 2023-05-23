import { useReducer, createContext, useContext, useEffect} from 'react'
import { getMultiplePokemons } from '../api';
import { getIdFromURL } from '../util';

const PokemonContext = createContext(null);

const initialState = {
	pokemons: {},
	pokemonCount: null,
	// nextRequest can be string or array
	nextRequest: '',
	pokemon_species: {},
	status: null,
	evolution_chain: {},
	searchParam: '',
	sortBy: 'numberAsc',
	advancedSearch: {
		generations: {},
		types: [],
	},
	display: [],
	allPokemonNamesAndId: {}
}

const reducer = (state, action) => {
	switch (action.type) {
		case 'dataLoading' : {
			return {
				...state, status: 'loading'
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
				...state, status: 'idle', pokemon_species: {...state.pokemon_species, [action.payload.id]: action.payload.data}
			}
		}
		case "evolutionChainLoaded" : {
			return {
				...state, status: 'idle', evolution_chain: {...state.evolution_chain, [action.payload.id]:action.payload.chain}
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
				...state, advancedSearch: {...state.advancedSearch, [field]: data}, status: 'loading'
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
		case 'nextRequestChanged' : {
			return {
				...state, nextRequest: action.payload
			}
		}
		case 'getAllPokemonNamesAndId' : {
			return {
				...state, allPokemonNamesAndId: action.payload
			}
		}
		default : 
			return state
	}
}

export default function PokemonsProvider({children}) {
	const [state, dispatch] = useReducer(reducer, initialState);

	useEffect(()=> {
		const getInitialPokemons = async () => {
			dispatch({type:'dataLoading'})
			// 24 is the common multiple of 2, 3, 4 (which are the amount of cards diplayed on each row in different viewports)
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/?limit=24`);
			const data = await response.json();
			dispatch({type: 'getPokemonCount', payload: data.count});
			const pokemonsToFetch = data.results.map(pokemon => getIdFromURL(pokemon.url));
			const pokemons = await getMultiplePokemons(pokemonsToFetch, undefined);
			const nextRequest = data.next.replace('pokemon-species', 'pokemon')
			dispatch({type: 'pokemonsLoaded', payload: {data: pokemons, nextRequest: nextRequest}});
			dispatch({type: 'displayChanged', payload: pokemonsToFetch})
		};
			getInitialPokemons()
	}, [dispatch]);

	return (
		<>
			<PokemonContext.Provider value={{state, dispatch}}>
				{children}
			</PokemonContext.Provider>
		</>
	)
}

export function usePokemonData() {
	return useContext(PokemonContext);
}