import ball from '../assets/ball.svg'
import { useState, useEffect, memo } from 'react'
import { usePokemonData } from './PokemonsProvider';

const FilterGeneration = memo(({generations:{selectedGenerations, setSelectedGenerations}}) => {
	const {state, dispatch} = usePokemonData()
	const [generationOptions, setGenerationOptions] = useState([]);
	const handleSelect = (e, generation) => {
		e.target.classList.toggle('selected');
		setSelectedGenerations(() => {
			const update = {...selectedGenerations};
			if (update[generation.name]) {
				delete update[generation.name]
			} else {
				update[generation.name] = generation.pokemon_species
			}
			return update
		});
	};
	console.log(selectedGenerations)

	useEffect(() => {
		const getGenerationInfo = async () => {
			const response = await fetch('https://pokeapi.co/api/v2/generation');
			const data = await response.json();
			const responses = await Promise.all(data.results.map(generation => fetch(generation.url)));
			const datas = responses.map(response => response.json());
			const finalData = await Promise.all(datas);
			setGenerationOptions(finalData.map(generation => generation))
		};
		getGenerationInfo();
	}, [setGenerationOptions])

	return (
		<ul className="generation col-12 col-sm-6 row justify-content-center gap-2">
			<div>
				<h3 ><img className="pokeBall" src={ball} alt="pokeBall" /> Generations</h3>
			</div>
			{generationOptions.map(generation => (
				<li onClick={(e) => handleSelect(e, generation)} key={generation.name} className={`d-flex justify-content-center align-items-center ${Object.keys(selectedGenerations).includes(generation.name) ? 'selected' : ''}`}>
					{(generation.name.replace('generation-', '')).toUpperCase()}
				</li>
			))}
		</ul>
	)
});

export default FilterGeneration