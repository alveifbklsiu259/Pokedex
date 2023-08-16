import { memo, useCallback } from 'react';
import { useSelector } from "react-redux";
import { selectGenerations } from '../pokemonData/pokemonDataSlice';
import pokeBall from '../../assets/ball.svg';

const FilterGeneration = memo(function FilterGeneration ({selectedGenerations, setSelectedGenerations}) {
	const generations = useSelector(selectGenerations);

	const handleSelectGeneration = useCallback(generation => {
		setSelectedGenerations(sg => {
			const update = {...sg};
			if (update[generation.name]) {
				delete update[generation.name];
			} else {
				update[generation.name] = generation.pokemon_species;
			};
			return update;
		});
	}, [setSelectedGenerations]);

	return (
		<ul className="generation col-12 col-sm-6 row justify-content-center gap-2">
			<div>
				<h3 ><img width='150' height='150' className="pokeBall" src={pokeBall} alt="pokeBall" /> Generations</h3>
			</div>
			{Object.values(generations).map(generation => (
				<Generation
					key={generation.name}
					generation={generation}
					onSelectGeneration={handleSelectGeneration}
					isGenerationSelected={Object.keys(selectedGenerations).includes(generation.name)}
				/>
			))}
		</ul>
	)
});

const Generation = memo(function Generation({generation, onSelectGeneration, isGenerationSelected}) {
	return (
		<li
			onClick={() => onSelectGeneration(generation)} 
			className={`d-flex justify-content-center align-items-center ${isGenerationSelected ? 'active' : ''}`}
		>
			{(generation.name.replace('generation-', '')).toUpperCase()}
		</li>
	)
});

export default FilterGeneration;