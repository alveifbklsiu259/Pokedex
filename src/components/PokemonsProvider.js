import { useReducer, createContext, useContext, useEddect} from 'react'

const PokemonContext = createContext(null);

const initialState = {
    pokemons: [],
    status: null
}

export default function PokemonsProvider({children}) {
    



    return (
        <>
            <PokemonContext.Provider value={1}>
                {children}
            </PokemonContext.Provider>
        </>
    )
}
