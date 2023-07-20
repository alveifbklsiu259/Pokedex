import { useState, useEffect } from 'react';
import { useNavigateNoUpdates } from './RouterUtils';
import AdvancedSearch from './AdvancedSearch';
import Input from './Input';
import pokeBall from '../assets/pokeBall.png';
import { getPokemons } from '../api';
import { getIdFromURL } from '../util';
import { useSelector, useDispatch } from 'react-redux';
// this is tedious... any other workaround?
import { selectPokeData, selectAllIdsAndNames, selectStatus, selectTypes, intersectionChanged, searchParamChanged, advancedSearchChanged } from '../features/pokemonData/pokemonDataSlice';

export default function Search({closeModal}) {
	const state = useSelector(selectPokeData);
	const dispatch = useDispatch();
	const [searchParam, setSearchParam] = useState('');
	const [selectedGenerations, setSelectedGenerations] = useState({});
	const [selectedTypes, setSelectedTypes] = useState([]);
	const [matchMethod, setMatchMethod] = useState('all');
	const navigateNoUpdates = useNavigateNoUpdates();
	// cached data
	const pokemonNames = Object.keys(useSelector(selectAllIdsAndNames))
	const status = useSelector(selectStatus);
	const types = useSelector(selectTypes)

	let pokemonRange = [];

	// get range
	switch (Object.keys(selectedGenerations).length) {
		// if no selected generations, default to all.
		case 0 : {
			for (let i = 0; i < pokemonNames.length; i ++) {
				let obj = {};
				obj.name = pokemonNames[i];
				obj.url = `https://pokeapi.co/api/v2/pokemon-species/${state.allPokemonNamesAndIds[pokemonNames[i]]}/`
				pokemonRange.push(obj);
			};
			break;
		}
		default : 
			pokemonRange = Object.values(selectedGenerations).flat();
	};

	useEffect(() => {
		// synchronizing state
		setSearchParam(state.searchParam);
		setSelectedGenerations(state.advancedSearch.generations);
		setSelectedTypes(state.advancedSearch.types);
		/* Note: At first, I though the code below would be better than just setting state to context state value, but no, since they point to the same references(when we dispatch, state.serchParam && searchParam, state.advancedSearch.generations && selectedTypes, state.advancedSearch.types && selectedGenerations, each pair point to the same reference).
		Since the value is identical, React will throw away this render pass(if you log anything in Search component, you'll see three logs after search button is clicked, but if you check profiler, there're only two related re-renders.(which is expected, one setting status to loading, one setting status to idle plus getting data))
		reference: https://github.com/facebook/react/issues/20817#issuecomment-778672150
		) */
		// setSelectedGenerations(sg => JSON.stringify(state.advancedSearch.generations) !== JSON.stringify(sg) ? state.advancedSearch.generations : sg);
		// setSelectedTypes(st => JSON.stringify(state.advancedSearch.types) !== JSON.stringify(st) ? state.advancedSearch.types : st);
	}, [state.searchParam, state.advancedSearch]);

	const handleSubmit = async e => {
		e.preventDefault();

		// handle search param
		const trimmedText = searchParam.trim();
		let searchResult = [];
		if (trimmedText === '') {
			// no input or only contains white space(s)
			searchResult = pokemonRange;
		} else if (isNaN(Number(trimmedText))) {
			// sort by name
			searchResult = pokemonRange.filter(pokemon => pokemon.name.toLowerCase().includes(trimmedText.toLowerCase()));
		} else {
			// sort by id
			searchResult = pokemonRange.filter(pokemon => String(getIdFromURL(pokemon.url)).padStart(4 ,'0').includes(String(trimmedText)));
		};

		// get intersection
		const rangeIds = searchResult.map(pokemon => getIdFromURL(pokemon.url));
		let intersection = rangeIds;

		// handle types
		if (selectedTypes.length) {
			if (matchMethod === 'all') {
				const typeMatchingArray = selectedTypes.reduce((pre, cur) => {
					pre.push(types[cur].pokemon.map(entry => getIdFromURL(entry.pokemon.url)));
					return pre;
				}, []);
				for (let i = 0; i < typeMatchingArray.length; i ++) {
					intersection = intersection.filter(pokemon => typeMatchingArray[i].includes(pokemon));
				};
			} else if (matchMethod === 'part') {
				const typeMatchingPokemonIds = selectedTypes.reduce((pre, cur) => {
					types[cur].pokemon.forEach(entry => pre.push(getIdFromURL(entry.pokemon.url)));
					return pre;
				}, []);
				intersection = rangeIds.filter(id => typeMatchingPokemonIds.includes(id));
			};
		};

		// only dispatch when necessary
		if (JSON.stringify(state.intersection) !== JSON.stringify(intersection)) {
			await getPokemons(dispatch, state.pokemons, state.allPokemonNamesAndIds, intersection, state.sortBy, state.status);
			dispatch(intersectionChanged(intersection));
			dispatch(searchParamChanged(searchParam));
			dispatch(advancedSearchChanged({field: 'generations', data: selectedGenerations}));
			dispatch(advancedSearchChanged({field: 'types', data: selectedTypes}));
		};
		// for search modal
		if (closeModal) {
			closeModal();
		};

		// currently on root
		if (state.viewMode === 'module') {
			if (document.querySelector('.sort')) {
				document.querySelector('.sort').scrollIntoView();
			} else {
				navigateNoUpdates('/', {state: 'resetPosition'});
				setTimeout(() => {
					document.querySelector('.sort').scrollIntoView();
				}, 10)
			};
		}
	};

	return (
		<div className="card-body mb-4 p-4">
			<h1 className="display-4 text-center">
				<img className='pokeBall' src={pokeBall} alt="pokeBall" width='46px' height='46px' /> Search For Pokémons
			</h1>
			<p className="lead text-center">By Name or the National Pokédex number</p>
			<form onSubmit={handleSubmit}>
				<Input
					searchParam={searchParam} 
					setSearchParam={setSearchParam}
				/>
				<AdvancedSearch
					searchParam={searchParam}
					setSearchParam={setSearchParam} 
					selectedTypes={selectedTypes} 
					setSelectedTypes={setSelectedTypes} 
					selectedGenerations={selectedGenerations} 
					setSelectedGenerations={setSelectedGenerations}
					setMatchMethod={setMatchMethod}
				/>
				<button 
					disabled={status === 'loading' ? true : false} 
					className="btn btn-primary btn-lg btn-block w-100 my-3" 
					type="submit"
				>
					Search
				</button>
			</form>
		</div>
	)
};