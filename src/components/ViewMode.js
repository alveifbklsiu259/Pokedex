import { memo, useState, useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { selectPokeData, selectStatus, selectViewMode, selectSpecies, selectPokemonCount, selectPokemons, viewModeChanged, getRequiredDataThunk, changeViewMode } from '../features/pokemonData/pokemonDataSlice';

const ViewMode = memo(function ViewMode() {
	const dispatch = useDispatch();
	const viewMode = useSelector(selectViewMode);

	const [view, setView] = useState(viewMode);
	const pokemonCount = useSelector(selectPokemonCount);
	const state = useSelector(selectPokeData)
	console.log(state, view)
	const status = useSelector(selectStatus);
	// const species = useSelector(selectSpecies);



	// const pokemons = useSelector(selectPokemons);
	// view and viewMode are not synchronizing... maybe we should change state.viewMode when in the pending state.

	useLayoutEffect(() => {
		if (status === 'idle' && view !== viewMode) {
			// console.log("EFFECT")
			// console.log(view, viewMode)
			setView(viewMode);
		}
	}, [view, setView, viewMode])

	// const handleChange = async(event, nextView) => {
	// 	if (nextView !== null && status !== 'loading') {
	// 		setView(nextView);
			
	// 		const range = [];
	// 		for (let i = 1; i <= pokemonCount; i ++) {
	// 			range.push(i);
	// 		};
	// 		const isSpeciesReady = Object.keys(species).length === pokemonCount;
	// 		const isPokemonsReady = Object.keys(pokemons).length < pokemonCount ? false : range.every(id => pokemons[id]);
	// 		console.time('1')

	// 		// is it benifitial to set this condition?
	// 		// can we set it in the thunk? or fulfilled case?
	// 		if (nextView === 'list') {
	// 			await dispatch(getRequiredDataThunk({requestPokemonIds: range, requests: ['pokemons', 'pokemonSpecies']}))
	// 		};
	// 		console.timeEnd('1')

	// 		// if we call getRequiredDataThunk, even it doesn't fetch any data, it still takes about 4 ms.


	// 		// should I use await here, or should change the table dispay when status === loading in Pokemons? I think I'll decide based on the execution order of these two dispatches here.
	// 		dispatch(viewModeChanged(nextView));
	// 	};
	// };
	const handleChange = async(event, nextView) => {
		if (nextView !== null) {
			const range = [];
			for (let i = 1; i <= pokemonCount; i ++) {
				range.push(i);
			};
			// setView will be batched with the state updates in the thunk's pending reducer function or thunk's body but not with the state updates in the fulfilled reducer function; Note that the execution order are not important here since there's no await expression in front of thunk dispatch. (also no need for it).
			setView(nextView);
			if (nextView === 'list') {

				// 1. fetching data will cause one re-render
				// 2. fulfilled will change state.viewMode, if this component listens for that value, this will cause another re-render.(also caused by state === 'idle')
				// so in total:
				// with data being fetched: 1, if not reading any state, 2 re-renders if reading viewMode. (the loading statsu will not cause re-renders if not reading status)
				// without data being fetched: 1 if not listens for viewMode, 2 if listening for viewMode.

				dispatch(changeViewMode({
					requestPokemonIds: range,
					requests: ['pokemons', 'pokemonSpecies'],
					viewMode: nextView
				}));

				// dispatch(viewModeChanged(nextView));
			} else {
				dispatch(viewModeChanged(nextView));
			};
			// check if this inconsistency happens in Search.js

			// if we call getRequiredDataThunk, even it doesn't fetch any data, it still takes about 4 ms.


			// should I use await here, or should change the table dispay when status === loading in Pokemons? I think I'll decide based on the execution order of these two dispatches here.
			// dispatch(viewModeChanged(nextView));
		};
	};

	return (
		// style={{pointerEvents:'none'}}
		<div className='mb-3 viewMode'>
			<ToggleButtonGroup
				value={view}
				exclusive
				onChange={handleChange}
				// disabled={status === 'loading'}
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

// pokemons' navigate is not working