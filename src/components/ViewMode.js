import {useState, useEffect} from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useSelector, useDispatch } from 'react-redux';
import { selectStatus, selectViewMode, selectSpecies, selectPokemonCount, selectPokemons, viewModeChanged, getRequiredDataThunk } from '../features/pokemonData/pokemonDataSlice';

export default function ViewMode() {
	const status = useSelector(selectStatus);
	const viewMode = useSelector(selectViewMode);
	const species = useSelector(selectSpecies);
	const pokemonCount = useSelector(selectPokemonCount);
	const pokemons = useSelector(selectPokemons);


	const dispatch = useDispatch();
	const [view, setView] = useState('module');

	useEffect(() => {
		if (view !== viewMode) {
			setView(viewMode);
		}
	}, [view, setView, viewMode])

	const handleChange = async(event, nextView) => {
		if (nextView !== null) {
			setView(nextView);
			
			const range = [];
			for (let i = 1; i <= pokemonCount; i ++) {
				range.push(i);
			};
			const isSpeciesReady = Object.keys(species).length === pokemonCount;
			const isPokemonsReady = Object.keys(pokemons).length < pokemonCount ? false : range.every(id => pokemons[id]);

			if (nextView === 'list' && (!isSpeciesReady || !isPokemonsReady)) {
				await dispatch(getRequiredDataThunk({requestPokemonIds: range, requests: ['pokemons', 'pokemonSpecies']}))
			};
			// should I use await here, or should change the table dispay when status === loading in Pokemons? I think I'll decide based on the execution order of these two dispatches here.
			dispatch(viewModeChanged(nextView));
		};
	};

	return (
		<div className='mb-3 viewMode'>
			<ToggleButtonGroup
				value={view}
				exclusive
				onChange={handleChange}
				disabled={status === 'loading'}
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
