import { useEffect, useCallback, useMemo } from "react";
import { usePokemonData } from "./PokemonsProvider";
import Sort from "./Sort";
import { PokemonCards } from "./BasicInfo";
import Spinner from "./Spinner";
import { getPokemonsOnScroll } from "../api";

export default function Pokemons() {
	const {state, dispatch} = usePokemonData();
	const cachedDispaly = useMemo(() => {
		let pokemonsToDisplay = [];
		for (let i = 0; i < state.display.length; i ++) {
			pokemonsToDisplay[i] = Object.values(state.pokemons).find(pokemon => pokemon.id === state.display[i]);
		};
		return pokemonsToDisplay
		// state changes will not affect them, they will still point to the same references, since we only shallow copy {...state} in each action case.
	}, [state.display, state.pokemons]);

	const handleScroll = useCallback(() => {
		if (window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight && state.status === 'idle' && state.nextRequest !== null) {
			getPokemonsOnScroll(dispatch, state.nextRequest, state.pokemons, state.display);
		};
	}, [state.status, state.nextRequest, getPokemonsOnScroll, state.pokemons, state.display]);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	let content = (
		<>
			{cachedDispaly.map(pokemon => (
				<PokemonCards key={pokemon.id} pokemon={pokemon}/>
			))}
		</>
	);

	if (state.status === 'loading') {
		content = <Spinner />
	} else if (state.status === 'idle' && cachedDispaly.length === 0) {
		content = <p className="text-center">No Pokémons to show</p>
	} else if (state.status === 'idle' || state.status === 'scrolling') {
		content = (
			<>
				{content}
				{state.status === 'scrolling' && <Spinner />}
			</>
		)
	};

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