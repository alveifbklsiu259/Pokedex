import { memo } from "react";
import { Link } from "react-router-dom";
import { getIdFromURL, getNameByLanguage } from "../util";

// this component is for memoization (Link)
export const PokemonCards = memo(function PokemonCards({pokemon, cachedLanguage, cachedSpecies,	cachedTypes}) {
	return (
		<div className="col-6 col-md-4 col-lg-3 card pb-3">
			<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
				<BasicInfo
					pokemon={pokemon}
					cachedLanguage={cachedLanguage}
					cachedSpecies={cachedSpecies}
					cachedTypes={cachedTypes}
				/>
			</Link>
		</div>
	)
});

const BasicInfo = memo(function BasicInfo({pokemon, cachedLanguage, cachedSpecies, cachedTypes}) {
	let pokemonName = getNameByLanguage(pokemon.name, cachedLanguage, cachedSpecies[getIdFromURL(pokemon.species.url)]);
	
	let nationalNumber = pokemon.id;
	if (!pokemon.is_default) {
		nationalNumber = getIdFromURL(pokemon.species.url);
		if (cachedLanguage !== 'en') {
			pokemonName = pokemonName.concat(`(${pokemon.name.replace(`${pokemon.species.name}-`, '')})`);
		};
	};
	
	return (
		<div className="basicInfo d-flex flex-column align-items-center text-center p-0 h-100">
			{/* width/heigh attributes are important for ScrollRestoration */}
			<img width='475' height='475' className="poke-img mx-auto p-0" src={pokemon.sprites.other['official-artwork'].front_default} alt={pokemonName} />
			<span className="id p-0">#{String(nationalNumber).padStart(4 ,'0')}</span>
			<h1 className="p-0 text-capitalize">{pokemonName}</h1>
			<div className="types row justify-content-center">
				{pokemon.types.map(entry => (
					<span 
						key={entry.type.name} 
						className={`type-${entry.type.name} type col-5 m-1`}
					>
						{getNameByLanguage(entry.type.name, cachedLanguage, cachedTypes[entry.type.name])}
					</span>
				))}
			</div>
		</div>
	)
});

export default BasicInfo;