import React, { memo } from 'react';
import { getIdFromURL, getNameByLanguage } from '../util';
import { useNavigateToPokemon } from '../api';
import { useSelector } from 'react-redux';
import { selectLanguage, selectPokemonById, selectSpeciesById } from '../features/pokemonData/pokemonDataSlice';

const Varieties = memo(function Varieties({pokeId}) {
	const navigateToPokemon = useNavigateToPokemon();
	const pokemon = useSelector(state => selectPokemonById(state, pokeId));
	const speciesData = useSelector(state => selectSpeciesById(state, pokeId));
	const language = useSelector(selectLanguage);

	const handleClick = async variety => {
		const targetFormId = getIdFromURL(variety.pokemon.url)
		const allFormIds = speciesData.varieties.map(entry => getIdFromURL(entry.pokemon.url));
		allFormIds.splice(allFormIds.indexOf(targetFormId), 1);
		const requestPokemonIds = [targetFormId, ...allFormIds];
		navigateToPokemon(requestPokemonIds, ['pokemons', 'abilities']);
	};
	
	const getVarietyName = ({pokemon, is_default}) => {
		if (language === 'en') {
			return pokemon.name;
		} else {
			const defaultName = getNameByLanguage(pokemon.name, language, speciesData);
			if (!is_default) {
				return defaultName.concat(`(${pokemon.name.replace(`${speciesData.name}-`, '')})`);
			} else {
				return defaultName;
			};
		};
	};

	return (
		<div className='col-12 varieties'>
			<ul>
				{speciesData.varieties.map(variety => (
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




// import React, { memo } from 'react';
// import { getIdFromURL, getNameByLanguage } from '../util';
// import { useNavigateToPokemon } from '../api';
// import { useSelector } from 'react-redux';
// import { selectLanguage, selectPokemonById, selectSpeciesById } from '../features/pokemonData/pokemonDataSlice';
// import PrefetchOnNavigation from './PrefetchOnNavigation';

// const Varieties = memo(function Varieties({pokeId}) {
// 	const navigateToPokemon = useNavigateToPokemon();
// 	const pokemon = useSelector(state => selectPokemonById(state, pokeId));
// 	const speciesData = useSelector(state => selectSpeciesById(state, pokeId));
// 	const language = useSelector(selectLanguage);

// 	const getRequestPokemonIds = variety => {
// 		const targetFormId = getIdFromURL(variety.pokemon.url)
// 		const allFormIds = speciesData.varieties.map(entry => getIdFromURL(entry.pokemon.url));
// 		allFormIds.splice(allFormIds.indexOf(targetFormId), 1);
// 		return [targetFormId, ...allFormIds];
// 	};
	
// 	const getVarietyName = ({pokemon, is_default}) => {
// 		if (language === 'en') {
// 			return pokemon.name;
// 		} else {
// 			const defaultName = getNameByLanguage(pokemon.name, language, speciesData);
// 			if (!is_default) {
// 				return defaultName.concat(`(${pokemon.name.replace(`${speciesData.name}-`, '')})`);
// 			} else {
// 				return defaultName;
// 			};
// 		};
// 	};

// 	return (
// 		<div className='col-12 varieties'>
// 			<ul>
// 				{speciesData.varieties.map(variety => (
// 					<React.Fragment key={variety.pokemon.name}>
// 						<li className={pokemon.name === variety.pokemon.name ? 'active' : ''}>
// 							<PrefetchOnNavigation
// 								requestPokemonIds={getRequestPokemonIds(variety)}
// 								requests={['pokemons', 'abilities']}
// 								customClass='text-capitalize'
// 							>
// 								<button>{getVarietyName(variety)}</button>
// 							</PrefetchOnNavigation>
// 						</li>
// 					</React.Fragment>
// 				))}
				
// 			</ul>
// 		</div>
// 	)
// });
// export default Varieties;