import { useEffect, useCallback } from "react";
import { usePokemonData } from "./PokemonsProvider";
import { Link } from "react-router-dom";
import Sort from "./Sort";
import BasicInfo from "./BasicInfo";
import Spinner from "./Spinner";
import { getPokemons } from "../api";

export default function Pokemons() {
	const {state, dispatch} = usePokemonData();
	let pokemonsToDisplay= [];
	for (let i = 0; i < state.display.length; i ++) {
		pokemonsToDisplay[i] = Object.values(state.pokemons).find(pokemon => pokemon.id === state.display[i]);
	};

	const handleDisplay = async() => {
		getPokemons(dispatch, state, state.nextRequest, state.sortBy, true);
	};

	const handleScroll = useCallback(() => {
		if (window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight && state.status === 'idle' && state.nextRequest !== null) {
			handleDisplay();
		};
	}, [state.status, state.nextRequest, handleDisplay])

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll])

	// Pokemons render 4 times, 2 times when state.status === 'loading'
	// console.log(123)

	let content;
	if (state.status === 'loading') {
		content = <Spinner />
	} else if (state.status === 'idle' && pokemonsToDisplay.length === 0) {
		content = <p className="text-center">No Pokémons to show</p>
	} else if (state.status === 'scrolling') {
		content = (
			<>
				{
					pokemonsToDisplay.map(pokemon => (
						<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
							<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
								<BasicInfo pokemon={pokemon}/>
							</Link>
						</div>
					))
				}
				{
					<Spinner/>
				}
			</>
		)
	} else if (state.status === 'idle') {
		content = (
			<>
				{
					pokemonsToDisplay.map(pokemon => (
						<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
							<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
								<BasicInfo pokemon={pokemon}/>
							</Link>
						</div>
					))
				}
			</>
		)
	};
	
	// console.log(state.status)
	// else if (state.status === 'scrolling') {
	// 	content = (
	// 		<>
	// 			{
	// 				pokemonsToDisplay.map(pokemon => (
	// 					<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
	// 						<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
	// 							<BasicInfo pokemon={pokemon}/>
	// 						</Link>
	// 					</div>
	// 				))
	// 			}
	// 			{
	// 				state.status === 'loading' && <Spinner />
	// 			}
	// 		</>
	// 	)
	// } 



	// if (state.status === 'loading') {
	// 	content = <Spinner />
	// } else if (state.status === 'scrolling') {
	// 	content = (
	// 		<>
	// 			{
	// 				pokemonsToDisplay.map(pokemon => (
	// 					<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
	// 						<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
	// 							<BasicInfo pokemon={pokemon}/>
	// 						</Link>
	// 					</div>
	// 				))
	// 			}
	// 			{
	// 				state.status === 'loading' && <Spinner />
	// 			}
	// 		</>
	// 	)
	// } else if (state.status === 'idle' && pokemonsToDisplay.length === 0) {
	// 	content = <p className="text-center">No Pokémons to show</p>
	// } else if (state.status === 'idle') {
	// 	content = (
	// 		<>
	// 			{
	// 				pokemonsToDisplay.map(pokemon => (
	// 					<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
	// 						<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
	// 							<BasicInfo pokemon={pokemon}/>
	// 						</Link>
	// 					</div>
	// 				))
	// 			}
	// 		</>
	// 	)
	// }

	// if (state.status === 'idle' && pokemonsToDisplay.length === 0) {
	// 	content = <p className="text-center">No Pokémons to show</p>
	// } else if (state.status === 'loading' && window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) {
	// 	content = <Spinner />
	// } else if (state.status === 'loading' && window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight) {
	// 	// for scroll
	// 	content = (
	// 		<>
	// 			{
	// 				pokemonsToDisplay.map(pokemon => (
	// 					<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
	// 						<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
	// 							<BasicInfo pokemon={pokemon}/>
	// 						</Link>
	// 					</div>
	// 				))
	// 			}
	// 			{
	// 				state.status === 'loading' && <Spinner />
	// 			}
	// 		</>
	// 	)
	// } else {
	// 	console.log(1123)
		
	// 	content = (
	// 		<>
	// 			{
	// 				pokemonsToDisplay.map(pokemon => (
	// 					<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
	// 						<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
	// 							<BasicInfo pokemon={pokemon}/>
	// 						</Link>
	// 					</div>
	// 				))
	// 			}
	// 		</>
	// 	)
	// }




	// let content;
	// if (state.status === 'idle' && pokemonsToDisplay.length === 0) {
	// 	content = <p className="text-center">No Pokémons to show</p>
	// } else if (state.status === 'loading' && window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight) {
	// 	content = <Spinner />
	// } else if (state.status === 'loading' && window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight) {
	// 	// for scroll
	// 	content = (
	// 		<>
	// 			{
	// 				pokemonsToDisplay.map(pokemon => (
	// 					<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
	// 						<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
	// 							<BasicInfo pokemon={pokemon}/>
	// 						</Link>
	// 					</div>
	// 				))
	// 			}
	// 			{
	// 				state.status === 'loading' && <Spinner />
	// 			}
	// 		</>
	// 	)
	// } else {
	// 	console.log(1123)
		
	// 	content = (
	// 		<>
	// 			{
	// 				pokemonsToDisplay.map(pokemon => (
	// 					<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3">
	// 						<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
	// 							<BasicInfo pokemon={pokemon}/>
	// 						</Link>
	// 					</div>
	// 				))
	// 			}
	// 		</>
	// 	)
	// }

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