import pokeBall from '../assets/ball.svg';
import { memo } from 'react';
import { getNameByLanguage } from '../util';
import { Switch, Stack, Typography, FormControlLabel } from '@mui/material';
import { useSelector } from "react-redux";
import { selectTypes, selectLanguage } from "../features/pokemonData/pokemonDataSlice";

const FilterTypes = memo(function FilterTypes ({selectedTypes, setSelectedTypes,setMatchMethod}) {
	const types = useSelector(selectTypes)
	const language = useSelector(selectLanguage)

	const onSelectType = type => {
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

	const onChangeMatchMethod = e => {
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
						control={<Switch color="primary" onClick={onChangeMatchMethod} />}
						label="Match"
						labelPlacement="bottom"
					/>
					<Typography>Part</Typography>
				</Stack>
			</div>
			{Object.keys(types).filter(type => type !== 'unknown' && type !== 'shadow').map(type => (
				<li 
					onClick={() => onSelectType(type)} 
					key={type} 
					className={`type type-${type} ${selectedTypes.includes(type) ? 'active' : ''}`}
				>{getNameByLanguage(type, language, types[type])}
				</li>
			))}
		</ul>
	)
});

export default FilterTypes;