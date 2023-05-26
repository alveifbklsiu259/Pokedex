import pokeBall from '../assets/pokeBall.png';
import { usePokemonData, useDispatchContenxt } from './PokemonsProvider';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
	let pokemonRange = [];
	// to cache Input
	const cachedAllPokemonNames = useMemo(() => {
		return Object.keys(state.allPokemonNamesAndIds);
	}, [state.allPokemonNamesAndIds])

	// get range
	switch (Object.keys(selectedGenerations).length) {
		// no selected generations, fetch all generations' pokemons
		case 0 : {
			for (let i = 0; i < cachedAllPokemonNames.length; i ++) {
				let obj = {};
				obj.name = cachedAllPokemonNames[i];
				obj.url = `https://pokeapi.co/api/v2/pokemon-species/${state.allPokemonNamesAndIds[cachedAllPokemonNames[i]]}/`
				pokemonRange.push(obj);
			};
			break;
		}
		default : 
			pokemonRange = Object.values(selectedGenerations).flat();
	};

	// synchronizing state
	useEffect(() => {
		if (searchParam !== state.searchParam) {
			setSearchParam(state.searchParam);
		};
		if(JSON.stringify(state.advancedSearch.generations) !== JSON.stringify(selectedGenerations)) {
			setSelectedGenerations(state.advancedSearch.generations);
		};
		if(JSON.stringify(state.advancedSearch.types) !== JSON.stringify(selectedTypes)) {
			setSelectedTypes(state.advancedSearch.types);
		};
	}, [state.searchParam, state.advancedSearch]);

	const handleSearch = async (e) => {
		// console.log(JSON.stringify(state.advancedSearch.types) == JSON.stringify(selectedTypes))
		// console.log('s',state.advancedSearch.types)
		// console.log('l',selectedTypes)

		e.preventDefault();
		// if (searchParam !== state.searchParam || JSON.stringify(selectedGenerations) !== JSON.stringify(state.advancedSearch.generations) || JSON.stringify(state.advancedSearch.types) !== JSON.stringify(selectedTypes)) {
			// handle search param
			let searchResult = [];
			if (searchParam === '' || searchParam.replaceAll(' ', '').length === 0) {
				// no input or only contains white spaces
				searchResult = pokemonRange;
			} else if (isNaN(Number(searchParam))) {
				// sort by name
				searchResult = pokemonRange.filter(pokemon => pokemon.name.toLowerCase().includes(searchParam.toLowerCase()));
			} else {
				// sort by id
				searchResult = pokemonRange.filter(pokemon => String(getIdFromURL(pokemon.url)).padStart(4 ,'0').includes(String(searchParam)));
			};
	
			// handle types
			const rangeIds = searchResult.map(pokemon => getIdFromURL(pokemon.url));
			const dataResponses = await Promise.all(selectedTypes.map(type => fetch(`https://pokeapi.co/api/v2/type/${type}`)));
			const datas = dataResponses.map(response => response.json());
			const finalData = await Promise.all(datas);
			const typesArrayToCompare = finalData.map(type => type.pokemon);
			const flattenedTypesArrayToCompare = typesArrayToCompare.map(type => type.map(pokemon => getIdFromURL(pokemon.pokemon.url)));
	
			// get intersection
			let intersection = rangeIds
			for (let i = 0; i < flattenedTypesArrayToCompare.length; i ++) {
				intersection = intersection.filter(pokemon => flattenedTypesArrayToCompare[i].includes(pokemon));
			};
			dispatch({type: 'intersectionChanged', payload: intersection});
			dispatch({type: 'searchParamChanged', payload: searchParam});
			dispatch({type: 'advancedSearchChanged', payload: {field: 'generations', data: selectedGenerations}});
			dispatch({type: 'advancedSearchChanged', payload: {field: 'types', data: selectedTypes}});
			getPokemons(dispatch, state, intersection, state.sortBy);
		console.log(intersection)

		// }
	}

	return (
		<div className="card-body mb-4 p-4">
			<h1 className="display-4 text-center">
				<img className='pokeBall' src={pokeBall} alt="pokeBall" /> Search For Pokémons
			</h1>
			<p className="lead text-center">By Name or the National Pokédex number</p>
			<form onSubmit={handleSearch}>
				<Input
					pokemonNames={cachedAllPokemonNames}
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