import React, {memo} from 'react';
import { useNavigate } from 'react-router-dom';
import { getMultiplePokemons, getPokemonsToFetch } from '../api';
import { getIdFromURL } from '../util';
import { useDispatchContenxt } from './PokemonsProvider';

const Varieties = memo(function Varieties({speciesInfo, pokemon, cachedPokemons, cachedNextRequest}) {
	const dispatch = useDispatchContenxt();
	const navigate = useNavigate();

	const handleClick = async e => {
		const formId = getIdFromURL(speciesInfo.varieties.find(variety => variety.pokemon.name === e.target.textContent).pokemon.url);

		navigate(`/pokemons/${formId}`, {replace: true});
		// we have state.status === 'idle' condition in Pokemon.js, no worry about duplicate requests.
		if (!cachedPokemons[formId]) {
			dispatch({type: 'dataLoading'})
			// fetch all forms
			const request = speciesInfo.varieties.map(variety => getIdFromURL(variety.pokemon.url));
			const pokemonsToFetch = getPokemonsToFetch(cachedPokemons, request);
			const fetchedPokemons = await getMultiplePokemons(pokemonsToFetch);

			// also get formData
			const dataResponses = await Promise.all(Object.values(fetchedPokemons).map(pokemon => fetch(pokemon.forms[0].url)));
			const datas = dataResponses.map(response => response.json());
			const formData = await Promise.all(datas);
			Object.values(fetchedPokemons).forEach(pokemon => {
				fetchedPokemons[pokemon.id].formData = formData.find(data => data.name === pokemon.name);
			});
			dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: cachedNextRequest}});
		};
	};

	return (
		<div className='col-12 varieties'>
			<ul>
				{speciesInfo.varieties.map(variety => (
					<React.Fragment key={variety.pokemon.name}>
						<li className={pokemon.name === variety.pokemon.name ? 'selected' : ''}>
							<button className='text-capitalize' onClick={handleClick}>{variety.pokemon.name}</button>
						</li>
					</React.Fragment>
				))}
				
			</ul>
		</div>
	)
});
export default Varieties;