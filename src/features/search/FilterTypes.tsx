import { memo, useCallback } from 'react';
import { Switch, Stack, Typography, FormControlLabel } from '@mui/material';
import { selectTypes } from '../pokemonData/pokemonDataSlice';
import { selectLanguage } from '../display/displaySlice';
import { getNameByLanguage } from '../../util';
import pokeBall from '../../assets/ball.svg';
import type { SelectedTypes } from './searchSlice';
import { useAppSelector } from '../../app/hooks';

type FilterTypesProps = {
	selectedTypes: SelectedTypes
	setSelectedTypes: React.Dispatch<React.SetStateAction<SelectedTypes>>,
	setMatchMethod: React.Dispatch<React.SetStateAction<"all" | "part">>
};

const FilterTypes = memo<FilterTypesProps>(function FilterTypes ({selectedTypes, setSelectedTypes, setMatchMethod}) {
	const types = useAppSelector(selectTypes);

	const handleSelectType = useCallback((type: string) => {
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

type TypeProps = {
	type: string,
	isTypeSelected: boolean, 
	onSelectType: (type: string) => void
}

const Type = memo<TypeProps>(function Type({type, isTypeSelected, onSelectType}) {
	const types = useAppSelector(selectTypes);
	const language = useAppSelector(selectLanguage);

	return (
		<li
			onClick={() => onSelectType(type)} 
			className={`type type-${type} ${isTypeSelected ? 'active' : ''}`}
		>
			{getNameByLanguage(type, language, types[type])}
		</li>
	)
});

type MatchMethodProps = {
	setMatchMethod: React.Dispatch<React.SetStateAction<"all" | "part">>
}

const MatchMethod = memo<MatchMethodProps>(function MatchMethod({setMatchMethod}) {
	const handleClick = (e: React.ChangeEvent<HTMLInputElement>) => {
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
				control={<Switch color="primary" onChange={handleClick} />}
				label="Match"
				labelPlacement="bottom"
			/>
			<Typography>Part</Typography>
		</Stack>
	);
});

export default FilterTypes;