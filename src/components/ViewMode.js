import {useState, useEffect} from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { getRequiredData } from '../api';
import { useSelector, useDispatch } from 'react-redux';
import { selectPokeData, viewModeChanged } from '../features/pokemonData/pokemonDataSlice';

export default function ViewMode() {
	const state = useSelector(selectPokeData);
	const dispatch = useDispatch();
	const [view, setView] = useState('module');

	useEffect(() => {
		if (view !== state.viewMode) {
			setView(state.viewMode);
		}
	}, [view, setView, state.viewMode])

	const handleChange = async(event, nextView) => {
		if (nextView !== null) {
			setView(nextView);
			
			const range = [];
			for (let i = 1; i <= state.pokemonCount; i ++) {
				range.push(i);
			};
			const isSpeciesReady = Object.keys(state.pokemonSpecies).length === state.pokemonCount;
			const isPokemonsReady = Object.keys(state.pokemons).length < state.pokemonCount ? false : range.every(id => state.pokemons[id]);

			if (nextView === 'list' && (!isSpeciesReady || !isPokemonsReady)) {
				await getRequiredData(state, dispatch, range, ['pokemons', 'pokemonSpecies']);
			};

			dispatch(viewModeChanged(nextView));
		};
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
