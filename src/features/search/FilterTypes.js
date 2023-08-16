import { memo, useCallback } from 'react';
import { useSelector } from "react-redux";
import { Switch, Stack, Typography, FormControlLabel } from '@mui/material';
import { selectTypes } from '../pokemonData/pokemonDataSlice';
import { selectLanguage } from '../display/displaySlice';
import { getNameByLanguage } from '../../util';
import pokeBall from '../../assets/ball.svg';

const FilterTypes = memo(function FilterTypes ({selectedTypes, setSelectedTypes, setMatchMethod}) {
	const types = useSelector(selectTypes);

	const handleSelectType = useCallback(type => {
		setSelectedTypes(st => {
			const update = [...st];
			if (update.includes(type)) {
				update.splice(update.indexOf(type), 1);
			} else {
				update.push(type)
			};
			return update;
		});
	}, [setSelectedTypes]);

	return (
		<ul className="typesFilter col-12 col-sm-6 row justify-content-center gap-3">
			<div>
				<h3 ><img width='150' height='150' className="pokeBall" src={pokeBall} alt="pokeBall" /> Types</h3>
				<MatchMethod setMatchMethod={setMatchMethod} />
			</div>
			{Object.keys(types).filter(type => type !== 'unknown' && type !== 'shadow').map(type => (
				<Type 
					key={type}
					type={type}
					isTypeSelected={selectedTypes.includes(type)}
					onSelectType={handleSelectType}
				/>
			))}
		</ul>
	)
});

const Type = memo(function Type({type, isTypeSelected, onSelectType}) {
	const types = useSelector(selectTypes);
	const language = useSelector(selectLanguage);

	return (
		<li
			onClick={() => onSelectType(type)} 
			className={`type type-${type} ${isTypeSelected ? 'active' : ''}`}
		>
			{getNameByLanguage(type, language, types[type])}
		</li>
	)
});

const MatchMethod = memo(function MatchMethod({setMatchMethod}) {
	const handleClick = e => {
		if(e.target.checked) {
			setMatchMethod('part');
		} else {
			setMatchMethod('all');
		};
	};

	return (
		<Stack direction="row" spacing={1} justifyContent="center" alignItems="baseLine">
			<Typography>All</Typography>
			<FormControlLabel
				control={<Switch color="primary" onClick={handleClick} />}
				label="Match"
				labelPlacement="bottom"
			/>
			<Typography>Part</Typography>
		</Stack>
	);
});

export default FilterTypes;