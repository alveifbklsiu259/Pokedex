import { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { selectViewMode, selectPokemonCount, viewModeChanged, changeViewMode } from '../features/pokemonData/pokemonDataSlice';

const ViewMode = memo(function ViewMode() {
	const dispatch = useDispatch();
	const viewMode = useSelector(selectViewMode);
	const pokemonCount = useSelector(selectPokemonCount);

	const handleChange = async(event, nextView) => {
		if (nextView !== null) {
			const requestPokemonIds = [];
			for (let i = 1; i <= pokemonCount; i ++) {
				requestPokemonIds.push(i);
			};
			if (nextView === 'list') {
				dispatch(changeViewMode({
					requestPokemonIds,
					requests: ['pokemons', 'pokemonSpecies'],
					viewMode: nextView
				}));
			} else {
				dispatch(viewModeChanged(nextView));
			};
		};
	};
	return (
		<div className='mb-3 viewMode'>
			<ToggleButtonGroup
				value={viewMode}
				exclusive
				onChange={handleChange}
			>
				<ToggleButton value="list" aria-label="list" >
					<i className="fa-solid fa-list"></i>
				</ToggleButton>
				<ToggleButton value="module" aria-label="module">
					<i className="fa-solid fa-table-cells-large"></i>
				</ToggleButton>
			</ToggleButtonGroup>
		</div>
	)
});
export default ViewMode;