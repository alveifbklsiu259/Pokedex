import React, { memo } from 'react';
import { useNavigateNoUpdates } from './RouterUtils';
import { getData, getDataToFetch, getAbilities, getAbilitiesToDisplay } from '../api';
import { getIdFromURL, getNameByLanguage, transformToKeyName } from '../util';
import { useDispatchContenxt } from './PokemonsProvider';

const Varieties = memo(function Varieties({speciesInfo, pokemon, cachedPokemons, cachedNextRequest, cachedLanguage, cachedAbilities}) {
	const dispatch = useDispatchContenxt();
	const navigateNoUpdates = useNavigateNoUpdates();
	const handleClick = async varietyName => {
		let fetchedPokemons, fetchedAbilities;

		const formId = getIdFromURL(speciesInfo.varieties.find(variety => variety.pokemon.name === varietyName).pokemon.url);
		// why do we put navigate here, instead of at the bottom?
		navigateNoUpdates(`/pokemons/${formId}`, {replace: true});

		const allFormsIds = speciesInfo.varieties.map(variety => getIdFromURL(variety.pokemon.url));

		const isAllPokemonDataReady = allFormsIds.every(id => cachedPokemons[id]);
		const requiredAbilities = isAllPokemonDataReady ? getAbilitiesToDisplay(allFormsIds.map(id => cachedPokemons[id])) : null;
		const isAllAbilityDataReady = requiredAbilities ? requiredAbilities.every(ability => cachedAbilities[ability]) : false;
		if (!isAllPokemonDataReady || (!isAllAbilityDataReady && cachedLanguage !== 'en')) {
			dispatch({type: 'dataLoading'});
			console.log(999)
		};

		if (!isAllPokemonDataReady) {
			// get all forms' pokemon data
			const pokemonsToFetch = getDataToFetch(cachedPokemons, allFormsIds);
			if (pokemonsToFetch.length) {
				fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
			};

			// also get formData (for Move.js)
			const formUrls = Object.values(fetchedPokemons).map(pokemon => pokemon.forms[0].url);
			const formData = await getData('pokemon-form', formUrls, 'name');
			Object.values(fetchedPokemons).forEach(pokemon => {
				fetchedPokemons[pokemon.id].formData = formData[transformToKeyName(pokemon.name)];
			});
		};

		if (!isAllAbilityDataReady && cachedLanguage !== 'en') {
			const pokemonData = allFormsIds.map(id => cachedPokemons[id] || fetchedPokemons[id]);
			fetchedAbilities = await getAbilities(pokemonData, cachedAbilities);
		};

		if (fetchedPokemons) {
			dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: cachedNextRequest}});
		}
		if (fetchedAbilities) {
			dispatch({type: 'abilityLoaded', payload: fetchedAbilities});
		};

	};
	

			// lookup formData, we fetch a lot of same data in different files, any way to improve it?

			//fetchedAbilities = await getData('ability', abilitiesToFetch, 'name'); in pokemon, optimize it
			// individualPokemonLoaded in pokemonProvider, optimize it

	const getVarietyName = ({pokemon, is_default}) => {
		if (cachedLanguage === 'en') {
			return pokemon.name;
		} else {
			const defaultName = getNameByLanguage(pokemon.name, cachedLanguage, speciesInfo);
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
							<button className='text-capitalize' onClick={() => handleClick(variety.pokemon.name)}>{getVarietyName(variety)}</button>
						</li>
					</React.Fragment>
				))}
				
			</ul>
		</div>
	)
});
export default Varieties;