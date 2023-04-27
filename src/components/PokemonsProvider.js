import { useReducer, createContext, useContext} from 'react'

const PokemonContext = createContext(null);

const initialState = {
    pokemons: [],
    pokemon_species: [],
    generation: {name:'', pokesAmount: 0 },
    status: null,
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
                ...state, status: 'idle', pokemon_species: action.payload
            }
        }
        default : 
            return state
    }
}


export default function PokemonsProvider({children}) {
    const [state, dispatch] = useReducer(reducer, initialState)
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