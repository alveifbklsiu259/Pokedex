import Search from "./Search"
import Pokemons from "./Pokemons"
import { usePokemonData } from './PokemonsProvider'
import Spinner from './Spinner'

export default function Index() {
    const {dispatch, state} = usePokemonData()
    let content;
    if (state.status === 'loading' || Object.values(state.pokemons).length < 1) {
        content = <Spinner />
    } else if (state.status === 'idle' && Object.values(state.pokemons).length > 0) {
        content = <Pokemons />
    } else if (state.status === 'error') {
        content = <p>Something went wrong...</p>
    }

    return (
        <div className="container">
            <Search />
            {content}
        </div>
    )
}