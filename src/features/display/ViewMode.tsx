import { memo, useMemo } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectViewMode, sortPokemons, tableInfoChanged, changeViewMode } from './displaySlice';
import type { TableInfoRefTypes } from '../pokemonData/Pokemons';

type ViewModeProps = {
	tableInfoRef: React.MutableRefObject<TableInfoRefTypes>
};

const ViewMode = memo(function ViewMode({tableInfoRef}: ViewModeProps) {
	const dispatch = useAppDispatch();
	const viewMode = useAppSelector(selectViewMode);

	const handleChange = async(event: React.MouseEvent<HTMLElement, MouseEvent>, nextView: typeof viewMode | null) => {
		if (nextView === 'module') {
			if (tableInfoRef.current.sortBy ) {
				// if the table is resorted, change sortBy when view mode is changed to module.
				dispatch(sortPokemons(tableInfoRef.current.sortBy));
				delete tableInfoRef.current.sortBy;
			};
			dispatch(tableInfoChanged({...tableInfoRef.current, selectedPokemonId: null}));
			tableInfoRef.current = {};
		};
		if (nextView !== null) {
			dispatch(changeViewMode({
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