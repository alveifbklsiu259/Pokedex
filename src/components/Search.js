import pokeBall from '../assets/pokeBall.png';
import { usePokemonData, useDispatchContenxt } from './PokemonsProvider';
import { useState, useEffect, useMemo } from 'react';
import AdvancedSearch from './AdvancedSearch';
import Input from './Input';
import { getPokemons } from '../api';
import { getIdFromURL } from '../util';

export default function Search() {
	const {state} = usePokemonData();
	const dispatch = useDispatchContenxt();
	const [searchParam, setSearchParam] = useState('');
	const [selectedGenerations, setSelectedGenerations] = useState({});
	const [selectedTypes, setSelectedTypes] = useState([]);
	// to cache Input
	const cachedPokemonNames = useMemo(() => {
		return Object.keys(state.allPokemonNamesAndIds);
	}, [state.allPokemonNamesAndIds]);
	let pokemonRange = [];

	// get range
	switch (Object.keys(selectedGenerations).length) {
		// no selected generations, fetch all generations' pokemons
		case 0 : {
			for (let i = 0; i < cachedPokemonNames.length; i ++) {
				let obj = {};
				obj.name = cachedPokemonNames[i];
				obj.url = `https://pokeapi.co/api/v2/pokemon-species/${state.allPokemonNamesAndIds[cachedPokemonNames[i]]}/`
				pokemonRange.push(obj);
			};
			break;
		}
		default : 
			pokemonRange = Object.values(selectedGenerations).flat();
	};

	// synchronizing state when necessary
	useEffect(() => {
		setSearchParam (sp => sp !== state.searchParam ? state.searchParam : sp);
		setSelectedGenerations(sg => JSON.stringify(state.advancedSearch.generations) !== JSON.stringify(sg) ? state.advancedSearch.generations : sg);
		setSelectedTypes(st => JSON.stringify(state.advancedSearch.types) !== JSON.stringify(st) ? state.advancedSearch.types : st);
	}, [state.searchParam, state.advancedSearch]);

	const handleSubmit = async e => {
		e.preventDefault();

		// handle search param
		let searchResult = [];
		if (searchParam === '' || searchParam.replaceAll(' ', '').length === 0) {
			// no input or only contains white space(s)
			searchResult = pokemonRange;
		} else if (isNaN(Number(searchParam))) {
			// sort by name
			searchResult = pokemonRange.filter(pokemon => pokemon.name.toLowerCase().includes(searchParam.toLowerCase()));
		} else {
			// sort by id
			searchResult = pokemonRange.filter(pokemon => String(getIdFromURL(pokemon.url)).padStart(4 ,'0').includes(String(searchParam)));
		};

		// get intersection
		const rangeIds = searchResult.map(pokemon => getIdFromURL(pokemon.url));
		let intersection = rangeIds;

		// handle types
		if (selectedTypes.length) {
			const dataResponses = await Promise.all(selectedTypes.map(type => fetch(`https://pokeapi.co/api/v2/type/${type}`)));
			const datas = dataResponses.map(response => response.json());
			const finalData = await Promise.all(datas);
			const typesArrayToCompare = finalData.map(type => type.pokemon);
			const flattenedTypesArrayToCompare = typesArrayToCompare.map(type => type.map(pokemon => getIdFromURL(pokemon.pokemon.url)));
			for (let i = 0; i < flattenedTypesArrayToCompare.length; i ++) {
				intersection = intersection.filter(pokemon => flattenedTypesArrayToCompare[i].includes(pokemon));
			};
		};

		// only dispatch when necessary
		if (JSON.stringify(state.intersection) !== JSON.stringify(intersection)) {
			dispatch({type: 'intersectionChanged', payload: intersection});
			dispatch({type: 'searchParamChanged', payload: searchParam});
			dispatch({type: 'advancedSearchChanged', payload: {field: 'generations', data: selectedGenerations}});
			dispatch({type: 'advancedSearchChanged', payload: {field: 'types', data: selectedTypes}});
			getPokemons(dispatch, state, intersection, state.sortBy);
		};
		document.querySelector('.sort').scrollIntoView();
	}

	return (
		<div className="card-body mb-4 p-4">
			<h1 className="display-4 text-center">
				<img className='pokeBall' src={pokeBall} alt="pokeBall" /> Search For Pokémons
			</h1>
			<p className="lead text-center">By Name or the National Pokédex number</p>
			<form onSubmit={handleSubmit}>
				<Input
					pokemonNames={cachedPokemonNames}
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
				/>
				<button className="btn btn-primary btn-lg btn-block w-100 my-3" type="submit">Search</button>
			</form>
		</div>
	)
};