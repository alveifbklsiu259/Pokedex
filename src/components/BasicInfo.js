import { memo } from "react";
import { Link } from "react-router-dom";
import { getIdFromURL } from "../util";

// this component is for memoization
export const PokemonCards = memo(function PokemonCards({pokemon}) {
	return (
		<div className="col-6 col-md-4 col-lg-3 card pb-3">
			<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
				<BasicInfo pokemon={pokemon}/>
			</Link>
		</div>
	)
});

const BasicInfo = function BasicInfo({pokemon}) {
	let nationalNumber = pokemon.id;
	if (!pokemon.is_default) {
		nationalNumber = getIdFromURL(pokemon.species.url);
	};
	
	return (
		<div className="basicInfo d-flex flex-column align-items-center text-center p-0 h-100">
			{/* width/heigh attributes are important for ScrollRestoration */}
			<img width='475' height='475' className="poke-img mx-auto p-0" src={pokemon.sprites.other['official-artwork'].front_default} alt={pokemon.name} />
			<span className="id p-0">#{String(nationalNumber).padStart(4 ,'0')}</span>
			<h1 className="p-0 text-capitalize">{pokemon.name}</h1>
			<div className="types row justify-content-center">
				{pokemon.types.map(type => <span key={type.type.name} className={`type-${type.type.name} type col-5 m-1`}>{type.type.name}</span>)}
			</div>
		</div>
	)
}

export default BasicInfo;