import React, { memo } from 'react';
import { getIdFromURL, getNameByLanguage } from '../util';
import { useDispatchContenxt, useNavigateToPokemon, usePokemonData } from './PokemonsProvider';

const Varieties = memo(function Varieties({speciesInfo, pokemon}) {
	const dispatch = useDispatchContenxt();
	const state = usePokemonData();
	const navigateToPokemon = useNavigateToPokemon();

	const handleClick = async variety => {
		const targetPokemonId = getIdFromURL(variety.pokemon.url)
		const formIds = speciesInfo.varieties.map(entry => getIdFromURL(entry.pokemon.url));
		formIds.splice(formIds.indexOf(targetPokemonId), 1);
		const requestPokemonIds = [targetPokemonId, ...formIds];
		navigateToPokemon(state, dispatch, requestPokemonIds, ['pokemons', 'abilities']);
	};
	
	const getVarietyName = ({pokemon, is_default}) => {
		if (state.language === 'en') {
			return pokemon.name;
		} else {
			const defaultName = getNameByLanguage(pokemon.name, state.language, speciesInfo);
			if (!is_default) {
				return defaultName.concat(`(${pokemon.name.replace(`${speciesInfo.name}-`, '')})`);
			} else {
				return defaultName;
			};
		};
	};

	return (
		<div className='col-12 varieties'>
			<ul>
				{speciesInfo.varieties.map(variety => (
					<React.Fragment key={variety.pokemon.name}>
						<li className={pokemon.name === variety.pokemon.name ? 'active' : ''}>
							<button className='text-capitalize' onClick={() => handleClick(variety)}>{getVarietyName(variety)}</button>
						</li>
					</React.Fragment>
				))}
				
			</ul>
		</div>
	)
});
export default Varieties;