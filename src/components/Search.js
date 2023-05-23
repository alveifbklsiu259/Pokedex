import pokeBall from '../assets/pokeBall.png'
import { usePokemonData } from './PokemonsProvider'
import { useState, useEffect} from 'react';
import AdvancedSearch from './AdvancedSearch';
import Input from './Input';
import { getMultiplePokemons, getPokemonsToFetch, getPokemons } from '../api';
import { getIdFromURL } from '../util';

export default function Search() {
	const {dispatch, state} = usePokemonData();
	const [searchParam, setSearchParam] = useState('');
	const [pokemonsRange, setPokemonsRange] = useState([]);

	const [selectedGenerations, setSelectedGenerations] = useState({});
	const [selectedTypes, setSelectedTypes] = useState([]);

	useEffect(() => {
		setSearchParam(state.searchParam);
		setSelectedGenerations(state.advancedSearch.generations);
		setSelectedTypes(state.advancedSearch.types);
	}, [state.searchParam, state.advancedSearch]);

	// get pokemons range
	useEffect(() => {
		const getPokemonsRange = async () => {
			switch (Object.keys(selectedGenerations).length) {
				// no selected generations, fetch all generations' pokemons
				case 0 : {
						const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/?limit=10000`);
						const data = await response.json();
						setPokemonsRange(() => data.results)
					break;
				}
				default : {
					setPokemonsRange(() => Object.values(selectedGenerations).flat())
					break;
				}
			}	
		}
		getPokemonsRange()
	}, [selectedGenerations, setPokemonsRange]);

	const handleSearch = async (e) => {
		e.preventDefault();
		dispatch({type: 'searchParamChanged', payload: searchParam});
		dispatch({type: 'advancedSearchChanged', payload: {field: 'generations', data: selectedGenerations}});
		dispatch({type: 'advancedSearchChanged', payload: {field: 'types', data: selectedTypes}});

		// handle search param
		let searchResult = [];
		if (searchParam === '') {
			searchResult = pokemonsRange
		} else if (isNaN(Number(searchParam))) {
			// sort by name
			searchResult = pokemonsRange.filter(pokemon => pokemon.name.includes(searchParam.toLowerCase()))
		} else {
			// sort by id, also remove preceding 0
			searchResult = pokemonsRange.filter(pokemon => String(getIdFromURL(pokemon.url)).includes(String(Number(searchParam))) )
		}


		// types
		const flattenedRange = searchResult.map(pokemon => getIdFromURL(pokemon.url));
		const dataResponses = await Promise.all(selectedTypes.map(type => fetch(`https://pokeapi.co/api/v2/type/${type}`)));
		const datas = dataResponses.map(response => response.json());
		const finalData = await Promise.all(datas);
		const typesArrayToCompare = finalData.map(type => type.pokemon);
		const flattenedTypesArrayToCompare = typesArrayToCompare.map(type => type.map(pokemon => getIdFromURL(pokemon.pokemon.url)));
		let intersection = flattenedRange
		for (let i = 0; i < flattenedTypesArrayToCompare.length; i ++) {
			intersection = intersection.filter(pokemon => flattenedTypesArrayToCompare[i].includes(pokemon));
			// intersection = intersection.filter(pokemon => flattenedTypesArrayToCompare[i].filter(comparePokemon => comparePokemon.startsWith(pokemon)).length !== 0);
		};

		// dispatch({type: 'displayChanged', payload: intersection});
		const pokemonsToFetch = getPokemonsToFetch(state.pokemons, intersection);
		// console.log(intersection)
		// await getMultiplePokemons(pokemonsToFetch, dispatch, null);

		getPokemons(dispatch, state, intersection, state.sortBy, false)
	}

	return (
		<div style={{background: 'blanchedalmond'}} className="card-body mb-4 p-4">
			<h1  className="display-4 text-center">
				<img style={{width: '10%'}} src={pokeBall} alt="pokeBall" /> Search For Pokémons
			</h1>
			<p className="lead text-center">By Name or the National Pokédex number</p>
			<form onSubmit={(e) => handleSearch(e)}>
				<Input searchParam={{searchParam, setSearchParam}}/>
				<AdvancedSearch param={{setSearchParam, searchParam}} types={{selectedTypes, setSelectedTypes}} generations={{selectedGenerations, setSelectedGenerations}} />
				<button className="btn btn-primary btn-lg btn-block w-100 my-3" type="submit">Search</button>
			</form>
		</div>
	)
}