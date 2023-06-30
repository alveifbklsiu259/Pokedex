import pokeBall from '../assets/ball.svg';
import { memo } from 'react';

const FilterGeneration = memo(function FilterGeneration ({selectedGenerations, setSelectedGenerations, cachedGenerations}) {

	const handleClick = generation => {
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
				<h3 ><img className="pokeBall" src={pokeBall} alt="pokeBall" /> Generations</h3>
			</div>
			{Object.values(cachedGenerations).map(generation => (
				<li
					onClick={() => handleClick(generation)} 
					key={generation.name} 
					className={`d-flex justify-content-center align-items-center ${Object.keys(selectedGenerations).includes(generation.name) ? 'active' : ''}`}
				>
					{(generation.name.replace('generation-', '')).toUpperCase()}
				</li>
			))}
		</ul>
	)
});

export default FilterGeneration