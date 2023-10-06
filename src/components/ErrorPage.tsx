import { useState } from "react";
import Input from "../features/search/Input";
import { router } from "../App";
import { searchPokemon } from "../features/search/searchSlice";
import { backToRoot } from "../features/display/displaySlice";
import { useAppDispatch } from "../app/hooks";

export default function ErrorPage() {
	const [searchParam, setSearchParam] = useState('');
	const dispatch = useAppDispatch();

	const handleBackToRoot = () => {
		dispatch(backToRoot());
		// reference: https://github.com/remix-run/react-router/issues/7634#issuecomment-1306650156
		router.navigate('/', {state: 'resetPosition'});
	};
	
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		dispatch(searchPokemon({searchParam}));
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
							<button onClick={handleBackToRoot} className="btn btn-block btn-secondary" >Go back to Pokedex</button>
						</li>
						<li className="my-2">Search a Pokemon</li>
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
};