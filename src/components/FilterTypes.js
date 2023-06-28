import pokeBall from '../assets/ball.svg';
import { memo } from 'react';
import { usePokemonData } from './PokemonsProvider';
import { getNameByLanguage } from '../util';

const FilterTypes = memo(function FilterTypes ({selectedTypes, setSelectedTypes, cachedTypes}) {
	const state = usePokemonData();

	const handleClick = type => {
		setSelectedTypes(() => {
			const update = [...selectedTypes];
			if (update.includes(type)) {
				update.splice(update.indexOf(type), 1);
			} else {
				update.push(type)
			}
			return update;
		});
	};

	return (
		<ul className="typesFilter col-12 col-sm-6 row justify-content-center gap-3">
			<div>
				<h3 ><img className="pokeBall" src={pokeBall} alt="pokeBall" /> Types</h3>
			</div>
			{Object.keys(cachedTypes).filter(type => type !== 'unknown' && type !== 'shadow').map(type => (
				<li 
					onClick={() => handleClick(type)} 
					key={type} 
					className={`type type-${type} ${selectedTypes.includes(type) ? 'active' : ''}`}
				>{getNameByLanguage(type, state.language, state.types[type])}
				</li>
			))}
		</ul>
	)
});

export default FilterTypes;