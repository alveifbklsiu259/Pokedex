import pokeBall from '../assets/ball.svg';
import { useState, useEffect, memo } from 'react';

const FilterTypes = memo(function FilterTypes ({selectedTypes, setSelectedTypes}) {
	const [types, setTypes] = useState([]);
	const handleClick = type => {
		setSelectedTypes(() => {
			const update = [...selectedTypes];
			if (update.includes(type.name)) {
				update.splice(update.indexOf(type.name), 1);
			} else {
				update.push(type.name)
			}
			return update;
		});
	};

	useEffect(() => {
		let ignore = false;

		const getTypes = async () => {
			const response = await fetch('https://pokeapi.co/api/v2/type');
			const data = await response.json();
			if (!ignore) {
				setTypes(data.results);
			}
		};
		getTypes();

		return () => {
			ignore = true
		}
	}, []);

	return (
		<ul className="typesFilter col-12 col-sm-6 row justify-content-center gap-3">
			<div>
				<h3 ><img className="pokeBall" src={pokeBall} alt="pokeBall" /> Types</h3>
			</div>
			{types.filter(type => type.name !== 'unknown' && type.name !== 'shadow').map(type => (
				<li 
					onClick={() => handleClick(type)} 
					key={type.name} 
					className={`type type-${type.name} ${selectedTypes.includes(type.name) ? 'selected' : ''}`}
				>{type.name}
				</li>
			))}
		</ul>
	)
});

export default FilterTypes