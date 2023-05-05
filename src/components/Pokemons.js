import BasicInfo from "./BasicInfo";
import { usePokemonData } from "./PokemonsProvider";
import { Link } from "react-router-dom";
import Sort from "./Sort";
import { useEffect, useState, useCallback } from "react";
import Spinner from "./Spinner";

export default function Pokemons() {
	const {state, dispatch} = usePokemonData();
	let searchParam = state.searchParam
	let searchResult = [];
	let sortedPokemons = [];

	// sorting:
	/* 
		1. range (national pokedex, gen 1, 2 ...)
		2-1. advanced search (types...)
		2-2. search param
		3. sorting order (num, name, heigh, weight)
		3-1 dealing with number -->
			check the range -->
				ascending: fetch('pokemon?limit=24') grab next as the next fetch url
				descending: fetch('pokemon?limit=${end_of_range}') grab previous as the next fetch url
		3-2 dealing with name -->
		check the range -->
			ascending: fetch('pokemon?limit=1100') loop throgh the array 
			notice cache


		3-3 dealing with height and width: --> check the range then sort, this'll decrease the chance that we have to fetch all pokemons(only when range is all)

		infinite stop at the end of the given range

		Note: weight/height require pokemon data being known


		sort by stats/colors/shapes
		add forms
		numbers starting 10000 are different form, should not appear on the pokedex, and when click them to their page will have an error
		if we go direct to /pokemons/999, since we don't have data in our pokemons state, we want to do individual fetch
		some poekons don't have flavor text (999...)
		// advanced show differnt forms on pokemons page or not
	*/

	// check range
	if (state.advancedSearch.generations.length === 0 ) {

	}




	useEffect(()=> {
		console.log()
		if (state.advancedSearch.generations.length === 0 ) {

		}

		// const getPokemons = async () => {
		// 	dispatch({type:'dataLoading'})
		// 	const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?limit=24`);
		// 	const data = await response.json();
		// 	const pokemonsResponses = await Promise.all(data.results.map(result => fetch(result.url)));
		// 	const pokemonsPromises = pokemonsResponses.map(pokemonsResponse => pokemonsResponse.json());
		// 	const finalData = await Promise.all(pokemonsPromises);
		// 	const pokemonsObj = {};
		// 	for (let i of finalData) {
		// 		pokemonsObj[i.id] = i
		// 	};
		// 	dispatch({type: 'pokemonsLoaded', payload: {data: pokemonsObj, nextRequest: data.next }})
		// };
		// 	getPokemons()
	}, [dispatch]);




















	const handleDisplay = async() => {
		if (state.nextRequest !== null) {
			dispatch({type: 'dataLoading'})
			const response = await fetch(state.nextRequest);
			const data = await response.json();
			const pokemonsResponses = await Promise.all(data.results.map(result => fetch(result.url)));
			const pokemonsPromises = pokemonsResponses.map(pokemonsResponse => pokemonsResponse.json());
			const finalData = await Promise.all(pokemonsPromises);
			const pokemonsObj = {};
			for (let i of finalData) {
				pokemonsObj[i.id] = i
			};
				dispatch({type: 'pokemonsLoaded', payload: {data: pokemonsObj, nextRequest: data.next }})
		}
		
		// exceptions
		// what about last?
		// order of sorting


	}

	const handleScroll = useCallback(() => {
		if (window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight && state.status === 'idle' ) {
			handleDisplay()
		}
	}, [state.status])

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll])


	// have to know the next fetch url
	// only show a specific amount of cards
	// infinite scroll


	// bf cache, when comes back, the filter still exists
	// show possible search options (dropdown)
	// automatically submit when not typing // suspense?

	// search function
	// using reducer
	if (searchParam === '') {
		searchResult = Object.values(state.pokemons) || [];
	} else if (isNaN(Number(searchParam))) {
		// sort by name
		searchParam = searchParam.toLowerCase();
		const pokemonsArray = Object.values(state.pokemons)
		searchResult = pokemonsArray.filter(pokemon => pokemon.name.includes(searchParam));
	} else {
		// sort by id
		// dealing with param with preceding 0
		searchParam = Number(searchParam);
		const filterArray = Object.keys(state.pokemons).filter(id => id.includes(searchParam));
		for (let i = 0; i < filterArray.length; i ++) {
			searchResult.push(state.pokemons[filterArray[i]])
		};
	}
	// sort function
	switch(state.sortBy) {
		case 'numberAsc' : {
			sortedPokemons = searchResult.sort((a, b) => a.id - b.id)
			break;
		}
		case 'numberDesc' : {
			sortedPokemons = searchResult.sort((a, b) => b.id - a.id)
			break;
		}
		case 'nameAsc' : {
			sortedPokemons = searchResult.sort((a, b) => a.name.localeCompare(b.name))
			break;
		}
		case 'nameDesc' : {
			sortedPokemons = searchResult.sort((a, b) => b.name.localeCompare(a.name))
			break;
		}
		case 'heightAsc' : {
			sortedPokemons = searchResult.sort((a, b) => a.height - b.height)
			break;
		}
		case 'heightDesc' : {
			sortedPokemons = searchResult.sort((a, b) => b.height - a.height)
			break;
		}
		case 'weightAsc' : {
			sortedPokemons = searchResult.sort((a, b) => a.weight - b.weight)
			break;
		}
		case 'weightDesc' : {
			sortedPokemons = searchResult.sort((a, b) => b.weight - a.weight)
			break;
		}
	}

	let content;

	if (state.status === 'idle' && sortedPokemons.length === 0) {
		content = <p className="text-center">No Pokémons to show</p>
	} else {
		content = (
			<>
				{
					sortedPokemons.map(pokemon => (
						<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
							<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
								<BasicInfo pokemon={pokemon}/>
							</Link>
						</div>
					))
				}
				{
					state.status === 'loading' && <Spinner />
				}
			</>
		)
	}

	// problem:
	// when filter, dispaly of pokemons will cause re-fetch if they don't exist in the previous display
	// but I already have those pokemons stored in my state, this should not happen
	// seems like the problem is because I disable cache in chrome devTool
	return (
		<>
			<div className="container">
				<Sort/>
				<div className="row g-5">
					{content}
				</div>
			</div>
		</>
	)
}