import { useReducer, createContext, useContext, useEffect} from 'react'
const PokemonContext = createContext(null);

const initialState = {
	pokemons: {},
	pokemon_species: {},
	generation: {name:'', pokesAmount: 0 },
	status: null,
	evolution_chain: {}
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
				...state, pokemons: action.payload, status:'idle'
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
		default : 
			return state
	}
}

export default function PokemonsProvider({children}) {
	const [state, dispatch] = useReducer(reducer, initialState);
	
	useEffect(()=> {
		const getPokemons = async () => {
			dispatch({type:'dataLoading'})
			const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?limit=151`);
			const data = await response.json();
			const pokemonsResponses = await Promise.all(data.results.map(result => fetch(result.url)));
			const pokemonsPromises = pokemonsResponses.map(pokemonsResponse => pokemonsResponse.json());
			const finalData = await Promise.all(pokemonsPromises);
			const pokemonsObj = {};
			for (let i of finalData) {
				pokemonsObj[i.id] = i
			};
			dispatch({type: 'pokemonsLoaded', payload: pokemonsObj})
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