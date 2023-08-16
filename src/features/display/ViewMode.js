import { memo, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { selectViewMode, sortPokemons, tableInfoChanged, changeViewMode } from './displaySlice';
import { selectPokemonCount } from '../pokemonData/pokemonDataSlice';

const ViewMode = memo(function ViewMode({tableInfoRef}) {
	const dispatch = useDispatch();
	const viewMode = useSelector(selectViewMode);
	const pokemonCount = useSelector(selectPokemonCount);

	const handleChange = async(event, nextView) => {
		if (nextView === 'module') {
			if (tableInfoRef.current.sortBy ) {
				// if the table is resorted, change sortBy when view mode is changed to module.
				dispatch(sortPokemons(tableInfoRef.current.sortBy));
			};
			delete tableInfoRef.current.sortBy;
			dispatch(tableInfoChanged({...tableInfoRef.current, selectedPokemonId: null}));
			tableInfoRef.current = {};
		};

		if (nextView !== null) {
			const requestPokemonIds = [];
			for (let i = 1; i <= pokemonCount; i ++) {
				requestPokemonIds.push(i);
			};
			dispatch(changeViewMode({
				requestPokemonIds,
				requests: ['pokemons', 'pokemonSpecies'],
				viewMode: nextView
			}));
		};
	};

	const listBtn = useMemo(() => (
		<ToggleButton value="list" aria-label="list" >
			<i className="fa-solid fa-list"></i>
		</ToggleButton>
	), []);

	const moduleBtn = useMemo(() => (
		<ToggleButton value="module" aria-label="module">
			<i className="fa-solid fa-table-cells-large"></i>
		</ToggleButton>
	), []);

	return (
		<div className='mb-3 viewMode'>
			<ToggleButtonGroup
				value={viewMode}
				exclusive
				onChange={handleChange}
			>
				{listBtn}
				{moduleBtn}
			</ToggleButtonGroup>
		</div>
	)
});
export default ViewMode;