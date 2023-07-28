import { memo } from 'react';
import { useSelector } from "react-redux";
import { Switch, Stack, Typography, FormControlLabel } from '@mui/material';
import { selectTypes, selectLanguage } from "../features/pokemonData/pokemonDataSlice";
import { getNameByLanguage } from '../util';
import pokeBall from '../assets/ball.svg';

const FilterTypes = memo(function FilterTypes ({selectedTypes, setSelectedTypes,setMatchMethod}) {
	const types = useSelector(selectTypes);
	const language = useSelector(selectLanguage);

	const handleSelectType = type => {
		setSelectedTypes(() => {
			const update = [...selectedTypes];
			if (update.includes(type)) {
				update.splice(update.indexOf(type), 1);
			} else {
				update.push(type)
			};
			return update;
		});
	};

	const handleChangeMatchMethod = e => {
		if(e.target.checked) {
			setMatchMethod('part');
		} else {
			setMatchMethod('all');
		};
	};

	return (
		<ul className="typesFilter col-12 col-sm-6 row justify-content-center gap-3">
			<div>
				<h3 ><img width='150' height='150' className="pokeBall" src={pokeBall} alt="pokeBall" /> Types</h3>
				<Stack direction="row" spacing={1} justifyContent="center" alignItems="baseLine">
					<Typography>All</Typography>
					<FormControlLabel
						control={<Switch color="primary" onClick={handleChangeMatchMethod} />}
						label="Match"
						labelPlacement="bottom"
					/>
					<Typography>Part</Typography>
				</Stack>
			</div>
			{Object.keys(types).filter(type => type !== 'unknown' && type !== 'shadow').map(type => (
				<li 
					onClick={() => handleSelectType(type)} 
					key={type} 
					className={`type type-${type} ${selectedTypes.includes(type) ? 'active' : ''}`}
				>
					{getNameByLanguage(type, language, types[type])}
				</li>
			))}
		</ul>
	)
});

export default FilterTypes;