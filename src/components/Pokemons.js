import BasicInfo from "./BasicInfo";
import { usePokemonData } from "./PokemonsProvider";
import { Link } from "react-router-dom";
import Filter from "./Filter";
export default function Pokemons() {
	const {state, dispatch} = usePokemonData();
	let searchParam = state.searchParam
	let searchResult = [];
	let sortedPokemons = [];
	

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
	if (sortedPokemons.length === 0) {
		content = <p className="text-center">No Pokémons to show</p>
	} else {
		content = (
			sortedPokemons.map(pokemon => (
				<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
					<Link to={`/pokemons/${pokemon.id}`}>
						<BasicInfo pokemon={pokemon}/>
					</Link>
				</div> 
			))
		)
	}


	// problem:
	// when filter, dispaly of pokemons will cause re-fetch if they don't exist in the previous display
	// but I already have those pokemons stored in my state, this should not happen
	// seems like the problem is because I disable cache in chrome devToll

	return (
		<>
			<div className="container">
				<Filter/>
				<div className="row g-5">
					{content}
				</div>
			</div>
		</>
	)
}