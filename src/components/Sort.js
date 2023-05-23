import { usePokemonData } from "./PokemonsProvider"
import { getPokemons, getMultiplePokemons, getPokemonsToFetch } from "../api";

export default function Sort() {
	const {state, dispatch} = usePokemonData();
	const dropdownOptions = [
		{text:'Number(low - high)', value: 'numberAsc'},
		{text:'Number(high - low)', value: 'numberDesc'},
		{text:'Name(A - Z)', value: 'nameAsc'},
		{text:'Name(Z - A)', value: 'nameDesc'},
		{text:'Height(short - tall)', value: 'heightAsc'},
		{text:'Height(tall - short)', value: 'heightDesc'},
		{text:'Weight(light - heavy)', value: 'weightAsc'},
		{text:'Weight(heavy - light)', value: 'weightDesc'}
	];
console.log(state)


	// select sort first --> change type --> search --> no pokemons
	// change types --> search --> change sort --> not correct
	// if there's any advanced search, you can find the range in dispaly + nextRequest

	// sort : no advanced search --> sort based on all pokemons else based on range
	// search: original sorting logic + based on sort
	// when should the pokemons being sort?
	// ---------------1. Pokemons --> when displaying
	// 2. api / Sort --> before fetching --> then you don;t have to sort pokemons in Pokemon.js
	

	const handleSortByChanged = async sortOption => {
		dispatch({type: 'sortByChanged', payload: sortOption});
		const sortPokemonsByName = async sortingOrder => {
			let sortedNames;
			if (sortingOrder === 'asc') {
				sortedNames = Object.keys(state.allPokemonNamesAndId).sort((a, b) => a.localeCompare(b));
			} else if(sortingOrder === 'desc') {
				sortedNames = Object.keys(state.allPokemonNamesAndId).sort((a, b) => b.localeCompare(a));
			}
			const sortedPokemons = sortedNames.reduce((prev, cur) => {
				prev[cur] = state.allPokemonNamesAndId[cur];
				return prev;
			}, {});
			const sortedId = Object.values(sortedPokemons);
			getPokemons(dispatch, state, sortedId, sortOption, false);
		};

		const sortPokemons = async (sortBy, sortingOrder) => {
			const request = [];
			for (let i = 1; i <= state.pokemonCount; i ++) {
				request.push(i);
			};
			const pokemonsToFetch = getPokemonsToFetch(state.pokemons, request);
			const fetchedPokemons = await getMultiplePokemons(pokemonsToFetch, dispatch, null);
			const allPokemons = {...state.pokemons, ...fetchedPokemons};
			let sortedPokemons;
			if (sortingOrder === 'asc') {
				sortedPokemons = Object.values(allPokemons).sort((a, b) => a[sortBy] - b[sortBy]);
			} else if (sortingOrder === 'desc') {
				sortedPokemons = Object.values(allPokemons).sort((a, b) => b[sortBy] - a[sortBy]);
			};
			const sortedId = sortedPokemons.map(pokemon => pokemon.id);
			getPokemons(dispatch, state, sortedId, sortOption, false);
		}

		switch (sortOption) {
			case "numberDesc" : {

				// no sorting logic yet
				if (state.advancedSearch.types.length === 0 && Object.keys(state.advancedSearch.generations).length === 0) {
					
				}
				getPokemons(dispatch, state, `https://pokeapi.co/api/v2/pokemon-species/?limit=24&offset=${state.pokemonCount - 24}`, sortOption, false);
				break;
			}
			case "nameAsc" : {
				sortPokemonsByName('asc');
				break;
			}
			case "nameDesc" : {
				sortPokemonsByName('desc');
				break;
			}
			case "heightAsc" : {
				sortPokemons('height', 'asc');
				break;
			}
			case "heightDesc" : {
				sortPokemons('height', 'desc');
				break;
			}
			case "weightAsc" : {
				sortPokemons('weight', 'asc');
				break;
			}
			case "weightDesc" : {
				sortPokemons('weight', 'desc');
				break;
			}
			default : {
				// "numberAsc"
				getPokemons(dispatch, state, `https://pokeapi.co/api/v2/pokemon-species/?limit=24`, sortOption, false)
			}
		}
	}
	
	return (
		<>
			<div className="sort dropdown text-end mb-4">
				<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
					Sort By {dropdownOptions.filter(option => option.value === state.sortBy)[0].text}
				</button>
				<ul className="dropdown-menu dropdown-menu-dark">
					{dropdownOptions.map(option => (
						<li key={option.value} onClick={() => handleSortByChanged(option.value)} className={`dropdown-item ${state.sortBy === option.value ? 'active' : ''}`} >{option.text}</li>
					))}
				</ul>
			</div>
		</>
	)
}