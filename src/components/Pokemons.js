import BasicInfo from "./BasicInfo";
import { usePokemonData } from "./PokemonsProvider";
import { Link } from "react-router-dom";
export default function Pokemons() {
	const {state, dispatch} = usePokemonData();

	return (
		<>
			<div className="container">
				<div className="row g-5">
					{state.pokemons.map(pokemon => (
						// <div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
						// 	<Link to={`/pokemons/${pokemon.id}`}>
						// 		<img className="w-100" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`} alt={pokemon.name} />
						// 		<p className="id">{`#${pokemon.id}`}</p>
						// 		<h2 className="name">{pokemon.name}</h2>
						// 		<div className="types">
						// 			{pokemon.types.map(type => <span key={type.type.name} className={`type-${type.type.name}`}>{type.type.name}</span>)}
						// 		</div>
						// 	</Link>
						// </div> 
						<BasicInfo key={pokemon.id} pokemon={pokemon}/>
					))}
				</div>
			</div>
		</>
	)
}