import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Input from "./Input";
import { selectAllIdsAndNames, selectStatus, selectPokemons, selectSortBy } from "../features/pokemonData/pokemonDataSlice";
import { router } from "../App";
import { getPokemons } from "../api";
import { backToRoot, searchParamChanged, intersectionChanged, advancedSearchReset } from "../features/pokemonData/pokemonDataSlice";

export default function ErrorPage() {
	const [searchParam, setSearchParam] = useState('');
	const dispatch = useDispatch();
	const allPokemonNamesAndIds = useSelector(selectAllIdsAndNames);
	const status = useSelector(selectStatus);
	const sortBy = useSelector(selectSortBy);
	const pokemons = useSelector(selectPokemons);

	const onBackToRoot = () => {
		dispatch(backToRoot());
		router.navigate('/', {state: 'resetPosition'});
	};
	
	const handleSubmit = e => {
		e.preventDefault();

		// handle search param
		const trimmedText = searchParam.trim();
		let intersection = [];
		if (trimmedText === '') {
			// no input or only contains white space(s)
			intersection = Object.values(allPokemonNamesAndIds);
		} else if (isNaN(Number(trimmedText))) {
			// sort by name
			const matchNames = Object.keys(allPokemonNamesAndIds).filter(name => name.toLowerCase().includes(trimmedText.toLowerCase()));
			intersection = matchNames.map(name => allPokemonNamesAndIds[name]);
		} else {
			// sort by id
			intersection = Object.values(allPokemonNamesAndIds).filter(id => String(id).padStart(4 ,'0').includes(String(trimmedText)));
		};

		dispatch(advancedSearchReset());
		dispatch(intersectionChanged(intersection));
		dispatch(searchParamChanged(searchParam));
		getPokemons(dispatch, pokemons, allPokemonNamesAndIds, intersection, sortBy, status);
		router.navigate('/');
	};

	return (
		<div className="errorPage">
			<div className="col-6">
				<img className="pageNotFoundImg" width='475' height='475' src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/79.png" alt="PageNotFound" />
			</div>
			<div>
				<h1 className="mt-3">Page Not Found</h1>
				<div className="p-3">
					<p className="text-center">The page you're looking for can not be found.</p>
					<ul className="mt-3">
						<li>
							<button onClick={onBackToRoot} className="btn btn-block btn-secondary" >Go back to Pokédex</button>
						</li>
						<li className="my-2">Search a Pokemon below</li>
					</ul>
					<form className="d-flex" onSubmit={handleSubmit}>
						<div className="flex-fill">
							<Input 
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