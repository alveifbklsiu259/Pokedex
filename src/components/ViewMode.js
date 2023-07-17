import {useState, useEffect} from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useDispatchContenxt, usePokemonData } from './PokemonsProvider';
import { getRequiredData } from '../api';

export default function ViewMode() {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const [view, setView] = useState('module');

	useEffect(() => {
		if (view !== state.viewMode) {
			setView(state.viewMode);
		}
	}, [view, setView, state.viewMode])

	const handleChange = async nextView => {
		if (nextView !== null) {
			setView(nextView);
			// dataloading?

			if (nextView === 'list' && Object.keys(state.pokemonSpecies).length !== state.pokemonCount) {
				const range = [];
				for (let i = 1; i <= state.pokemonCount; i ++) {
					range.push(i);
				};
				await getRequiredData(state, dispatch, range, ['pokemons', 'pokemonSpecies']);
			};

			dispatch({type: 'viewModeChanged', payload: nextView});
		}
	};

	return (
		<div className='mb-3 viewMode'>
			<ToggleButtonGroup
				value={view}
				exclusive
				onChange={handleChange}
				disabled={state.status === 'loading'}
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
};
