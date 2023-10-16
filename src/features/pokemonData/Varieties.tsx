import React, { memo } from 'react';
import { selectPokemonById, selectPokemons, selectSpeciesById } from './pokemonDataSlice';
import { selectLanguage } from '../display/displaySlice';
import { getFormName, getIdFromURL } from '../../util';
import { useNavigateToPokemon } from '../../api';
import { useAppSelector } from '../../app/hooks';

type VarietiesProps = {
	pokeId: string
};

const Varieties = memo<VarietiesProps>(function Varieties({pokeId}) {
	const navigateToPokemon = useNavigateToPokemon();
	const pokemon = useAppSelector(state => selectPokemonById(state, pokeId))!;
	const speciesData = useAppSelector(state => selectSpeciesById(state, pokeId))!;
	const language = useAppSelector(selectLanguage);
	const pokemons = useAppSelector(selectPokemons);

	return (
		<div className='col-12 varieties'>
			<ul>
				{speciesData.varieties.map(variety => (
					<React.Fragment key={variety.pokemon.name}>
						<li className={pokemon.name === variety.pokemon.name ? 'active' : ''}>
							<button 
								className='text-capitalize' 
								onClick={() => navigateToPokemon([getIdFromURL(variety.pokemon.url)], ['ability'])}
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