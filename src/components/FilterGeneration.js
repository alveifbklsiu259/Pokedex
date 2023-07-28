import { memo } from 'react';
import { useSelector } from "react-redux";
import { selectGenerations } from "../features/pokemonData/pokemonDataSlice";
import pokeBall from '../assets/ball.svg';

const FilterGeneration = memo(function FilterGeneration ({selectedGenerations, setSelectedGenerations}) {
	const generations = useSelector(selectGenerations);

	const handleSelectGeneration = generation => {
		setSelectedGenerations(() => {
			const update = {...selectedGenerations};
			if (update[generation.name]) {
				delete update[generation.name];
			} else {
				update[generation.name] = generation.pokemon_species;
			};
			return update;
		});
	};

	return (
		<ul className="generation col-12 col-sm-6 row justify-content-center gap-2">
			<div>
				<h3 ><img width='150' height='150' className="pokeBall" src={pokeBall} alt="pokeBall" /> Generations</h3>
			</div>
			{Object.values(generations).map(generation => (
				<li
					onClick={() => handleSelectGeneration(generation)} 
					key={generation.name} 
					className={`d-flex justify-content-center align-items-center ${Object.keys(selectedGenerations).includes(generation.name) ? 'active' : ''}`}
				>
					{(generation.name.replace('generation-', '')).toUpperCase()}
				</li>
			))}
		</ul>
	)
});

export default FilterGeneration;