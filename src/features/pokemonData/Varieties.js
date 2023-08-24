import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { selectPokemonById, selectPokemons, selectSpeciesById } from './pokemonDataSlice';
import { selectLanguage } from '../display/displaySlice';
import { getFormName, getIdFromURL } from '../../util';
import { useNavigateToPokemon } from '../../api';

const Varieties = memo(function Varieties({pokeId}) {
	const navigateToPokemon = useNavigateToPokemon();
	const pokemon = useSelector(state => selectPokemonById(state, pokeId));
	const speciesData = useSelector(state => selectSpeciesById(state, pokeId));
	const language = useSelector(selectLanguage);
	const pokemons = useSelector(selectPokemons);
	
	return (
		<div className='col-12 varieties'>
			<ul>
				{speciesData.varieties.map(variety => (
					<React.Fragment key={variety.pokemon.name}>
						<li className={pokemon.name === variety.pokemon.name ? 'active' : ''}>
							<button 
								className='text-capitalize' 
								onClick={() => navigateToPokemon([getIdFromURL(variety.pokemon.url)], ['abilities'])}
							>
								{getFormName(speciesData, language, pokemons[getIdFromURL(variety.pokemon.url)])}
							</button>
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






// implement this if we want to show non-default-form pokemon at root.
// the name should also be for BasicInfo.

// import React, { memo } from 'react';
// import { getIdFromURL, getNameByLanguage } from '../util';
// import { useNavigateToPokemon } from '../api';
// import { useSelector } from 'react-redux';
// import { selectLanguage, selectPokemonById, selectPokemons, selectSpeciesById } from '../features/pokemonData/pokemonDataSlice';

// const Varieties = memo(function Varieties({pokeId}) {
// 	const navigateToPokemon = useNavigateToPokemon();
// 	const pokemon = useSelector(state => selectPokemonById(state, pokeId));
// 	const pokemons = useSelector(selectPokemons);


// 	const speciesData = useSelector(state => selectSpeciesById(state, pokeId));
// 	const language = useSelector(selectLanguage);

// 	const handleClick = async variety => {
// 		const targetFormId = getIdFromURL(variety.pokemon.url)
// 		const allFormIds = speciesData.varieties.map(entry => getIdFromURL(entry.pokemon.url));
// 		allFormIds.splice(allFormIds.indexOf(targetFormId), 1);
// 		const requestPokemonIds = [targetFormId, ...allFormIds];
// 		navigateToPokemon(requestPokemonIds, ['pokemons', 'abilities']);
// 	};
	
// 	const getVarietyName = ({pokemon: poke, is_default}) => {
// 		if (language === 'en') {
// 			return poke.name;
// 		} else {
// 			const defaultName = getNameByLanguage(poke.name, language, speciesData);

// 			if (!is_default) {
// 				let formName;
// 				// check if we have those form's pokemon data
// 				const formData = pokemons[getIdFromURL(poke.url)]?.formData;
// 				if (formData) {
// 					formName = getNameByLanguage(formData.name, language, formData)
// 					return defaultName.concat(`(${formName})`);
// 				} else {
// 					return defaultName.concat(`(${poke.name.replace(`${speciesData.name}-`, '')})`);
// 				}
// 				// maybe replace the original if the formName contains it?
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
// 							<button className='text-capitalize' onClick={() => handleClick(variety)}>{getVarietyName(variety)}</button>
// 						</li>
// 					</React.Fragment>
// 				))}
				
// 			</ul>
// 		</div>
// 	)
// });
// export default Varieties;