import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePokemonData, useDispatchContenxt } from "./PokemonsProvider"
import Input from "./Input";
import { getPokemons } from "../api";

export default function ErrorPage() {
	const [searchParam, setSearchParam] = useState('');
	const navigate = useNavigate();
	const dispatch = useDispatchContenxt();
	const state = usePokemonData();
	
	const cachedPokemonNames = useMemo(() => {
		return Object.keys(state.allPokemonNamesAndIds);
	}, [state.allPokemonNamesAndIds]);

	const handleBack = () => {
		dispatch({type: 'backToRoot'});
		navigate('/', {state: 'backToRoot'});
	};
	
	const handleSubmit = e => {
		e.preventDefault();

		// handle search param
		const trimmedText = searchParam.trim();
		let intersection = [];
		if (trimmedText === '') {
			// no input or only contains white space(s)
			intersection = Object.values(state.allPokemonNamesAndIds);
		} else if (isNaN(Number(trimmedText))) {
			// sort by name
			const matchNames = Object.keys(state.allPokemonNamesAndIds).filter(name => name.toLowerCase().includes(trimmedText.toLowerCase()));
			intersection = matchNames.map(name => state.allPokemonNamesAndIds[name]);
		} else {
			// sort by id
			intersection = Object.values(state.allPokemonNamesAndIds).filter(id => String(id).padStart(4 ,'0').includes(String(trimmedText)));
		};

		dispatch({type: 'advancedSearchReset'});
		dispatch({type: 'intersectionChanged', payload: intersection});
		dispatch({type: 'searchParamChanged', payload: searchParam});
		getPokemons(dispatch, state.pokemons, state.allPokemonNamesAndIds, intersection, state.sortBy, state.status);
		navigate('/');
	};

	return (
		<div className="errorPage">
			<div className="col-6">
				<img width='475' height='475' src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/79.png" alt="PageNotFound" />
			</div>
			<div>
				<h1 className="mt-3">Page Not Found</h1>
				<div className="p-3">
					<p className="text-center">The page you're looking for can not be found, you can try:</p>
					<ul className="mt-3">
						<li>
							<button onClick={handleBack} className="btn btn-block btn-secondary" >Go back to Pokédex</button>
						</li>
						<li className="my-2">Search a Pokemon below</li>
					</ul>
					<form className="d-flex" onSubmit={handleSubmit}>
						<div className="flex-fill">
							<Input 
								pokemonNames={cachedPokemonNames}
								searchParam={searchParam}
								setSearchParam={setSearchParam}
							/>
						</div>
						<button className="btn btn-primary btn-block ms-2" type="submit"><i className="fa-solid fa-magnifying-glass"></i></button>
					</form>
				</div>
			</div>
		</div>
	)
}