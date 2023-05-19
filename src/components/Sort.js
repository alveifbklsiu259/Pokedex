import { usePokemonData } from "./PokemonsProvider"
import { getPokemonsToFetch, getMultiplePokemons } from "../api";
import { getIdFromURL } from "../util";

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

	const handleSortByChanged = async sortOption => {
		dispatch({type: 'sortByChanged', payload: sortOption});

		// check pokemons to fetch (range) / nextRequest
		// dispatch displayChanged

		// set display list --> check cache pokemons --> pokemons to fetch list --> fetch individual pokemons


		switch (sortOption) {
			case "numberAsc" : {
				// pokemons are already fetched
				dispatch({type:'dataLoading'})
				//getting next request
				const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/?limit=24`);
				const data = await response.json();
				const nextRequest = data.next.replace('pokemon-species', 'pokemon');

				//getting pokemons to fetch

				const pokemonsToDisplay = data.results.map(pokemon => getIdFromURL(pokemon.url));
				
				dispatch({type: 'nextRequestChanged', payload: nextRequest});
				dispatch({type: 'displayChanged', payload: pokemonsToDisplay});
				break;
			}
			case "numberDesc" : {
				dispatch({type: 'dataLoading'});
				//getting next request
				const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/?limit=24&offset=${state.pokemonCount - 24}`);
				const data = await response.json();
				const nextRequest = data.previous.replace('pokemon-species', 'pokemon');

				//getting pokemons to fetch
				const pokemonsToDisplay = data.results.map(pokemon => getIdFromURL(pokemon.url));
				const pokemonsToFetch = getPokemonsToFetch(state.pokemons, pokemonsToDisplay);
				// get pokemons
				const pokemons = await getMultiplePokemons(pokemonsToFetch, undefined);

				dispatch({type: 'pokemonsLoaded', payload: {data: pokemons, nextRequest: nextRequest}});
				dispatch({type: 'displayChanged', payload: pokemonsToDisplay});
				break;


				// if i'm gonna show only 24 pokemons + infinite scroll, notice if the Pokemons component gets re-render after scroll

			}
			case "nameAsc" : {
				const sortedPokemonNames = Object.keys(state.allPokemonNamesAndId).sort((a, b) => a.localeCompare(b));
	
				const sortedPokemonNamesAndId = sortedPokemonNames.reduce((prev, cur) => {
					prev[cur] = state.allPokemonNamesAndId[cur];
					return prev
				}, {});

				// pokemons to fetch, but we only want to fetch the first 24 pokemons, and fetch the reset after scrolling
				console.log(Object.values(sortedPokemonNamesAndId))

			}
			case "nameDesc" : {

			}
			case "heightAsc" : {

			}
			case "heightDesc" : {
				
			}
			case "weightAsc" : {

			}
			case "weightDesc" : {
				
			}
		}





		// function sort(displayPokemons) {
		// 	switch(state.sortBy) {
		// 		case 'numberAsc' : {
		// 			displayPokemons.sort((a, b) => a.id - b.id)
		// 			break;
		// 		}
		// 		case 'numberDesc' : {
		// 			displayPokemons.sort((a, b) => b.id - a.id)
		// 			break;
		// 		}
		// 		case 'nameAsc' : {
		// 			displayPokemons.sort((a, b) => a.name.localeCompare(b.name))
		// 			break;
		// 		}
		// 		case 'nameDesc' : {
		// 			displayPokemons.sort((a, b) => b.name.localeCompare(a.name))
		// 			break;
		// 		}
		// 		case 'heightAsc' : {
		// 			displayPokemons.sort((a, b) => a.height - b.height)
		// 			break;
		// 		}
		// 		case 'heightDesc' : {
		// 			displayPokemons.sort((a, b) => b.height - a.height)
		// 			break;
		// 		}
		// 		case 'weightAsc' : {
		// 			displayPokemons.sort((a, b) => a.weight - b.weight)
		// 			break;
		// 		}
		// 		case 'weightDesc' : {
		// 			displayPokemons.sort((a, b) => b.weight - a.weight)
		// 			break;
		// 		}
		// 	}
		// }



		


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