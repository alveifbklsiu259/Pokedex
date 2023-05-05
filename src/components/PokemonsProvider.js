import { useReducer, createContext, useContext, useEffect} from 'react'
const PokemonContext = createContext(null);

const initialState = {
	pokemonsRange:[],
	pokemons: {},
	// common multiple of 2, 3, 4 (which are the amount of cards diplayed on each row in different viewports)
	// displayAmount: 24,
	nextRequest: '',
	pokemon_species: {},
	status: null,
	evolution_chain: {},
	searchParam: '',
	sortBy: 'numberAsc',
	advancedSearch: {
		generations: [],
		types: []
	}
}

const reducer = (state, action) => {
	switch (action.type) {
		case 'dataLoading' : {
			return {
				...state, status: 'loading'
			}
		}
		case 'pokemonsLoaded' : {
			return {
				...state, pokemons: {...state.pokemons ,...action.payload.data}, status:'idle', nextRequest: action.payload.nextRequest
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
			const update = [...state.advancedSearch[field]];
			if (update.includes(data)) {
				update.splice(update.indexOf(data), 1)
			} else {
				update.push(data)
			}
			return {
				...state, advancedSearch: {...state.advancedSearch, [field]: update}
			}
		}
		case 'pokemonsRangeChanged' : {
			const update = [...state.pokemonsRange];
			if (update.includes(action.payload)) {
				update.splice(update.indexOf(action.payload), 1)
			} else {
				update.push(action.payload)
			}
			return {
				...state, pokemonsRange: update
			}
		}
		
		default : 
			return state
	}
}

export default function PokemonsProvider({children}) {
	const [state, dispatch] = useReducer(reducer, initialState);

	useEffect(()=> {
		console.log()
		if (state.advancedSearch.generations.length === 0 ) {

		}

		const getPokemons = async () => {
			dispatch({type:'dataLoading'})
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?limit=24`);
			const data = await response.json();
			const pokemonsResponses = await Promise.all(data.results.map(result => fetch(result.url)));
			const pokemonsPromises = pokemonsResponses.map(pokemonsResponse => pokemonsResponse.json());
			const finalData = await Promise.all(pokemonsPromises);
			const pokemonsObj = {};
			for (let i of finalData) {
				pokemonsObj[i.id] = i
			};
			dispatch({type: 'pokemonsLoaded', payload: {data: pokemonsObj, nextRequest: data.next }})
		};
			getPokemons()
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