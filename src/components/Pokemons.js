import BasicInfo from "./BasicInfo";
import { usePokemonData } from "./PokemonsProvider";
import { Link } from "react-router-dom";
export default function Pokemons() {
	const {state, dispatch} = usePokemonData();
	const pokemonsArr = Object.values(state.pokemons) || [];
	return (
		<>
			<div className="container">
				<div className="row g-5">
					{pokemonsArr.map(pokemon => (
						<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
							<Link to={`/pokemons/${pokemon.id}`}>
								<BasicInfo pokemon={pokemon}/>
							</Link>
						</div> 
					))}
				</div>
			</div>
		</>
	)
}