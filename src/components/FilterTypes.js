import pokeBall from '../assets/ball.svg';
import { memo } from 'react';
import { getNameByLanguage } from '../util';
import { Switch, Stack, Typography, FormControlLabel } from '@mui/material';

const FilterTypes = memo(function FilterTypes ({selectedTypes, setSelectedTypes,setMatchMethod, cachedTypes, cachedLanguage}) {

	const selectType = type => {
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

	const changeMatchMethod = e => {
		if(e.target.checked) {
			setMatchMethod('part')
		} else {
			setMatchMethod('all')
		};
	};

	return (
		<ul className="typesFilter col-12 col-sm-6 row justify-content-center gap-3">
			<div>
				<h3 ><img className="pokeBall" src={pokeBall} alt="pokeBall" /> Types</h3>
				<Stack direction="row" spacing={1} justifyContent="center" alignItems="baseLine">
					<Typography>All</Typography>
					<FormControlLabel
						control={<Switch color="primary" onClick={changeMatchMethod} />}
						label="Match"
						labelPlacement="bottom"
					/>
					<Typography>Part</Typography>
				</Stack>
			</div>
			{Object.keys(cachedTypes).filter(type => type !== 'unknown' && type !== 'shadow').map(type => (
				<li 
					onClick={() => selectType(type)} 
					key={type} 
					className={`type type-${type} ${selectedTypes.includes(type) ? 'active' : ''}`}
				>{getNameByLanguage(type, cachedLanguage, cachedTypes[type])}
				</li>
			))}
		</ul>
	)
});

export default FilterTypes;