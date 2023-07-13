import { useEffect, useCallback, useMemo } from "react";
import { usePokemonData, useDispatchContenxt, useCachedData, useNavigateToPokemon } from "./PokemonsProvider";
import Sort from "./Sort";
import BasicInfo from "./BasicInfo";
import ScrollToTop from "./ScrollToTop";
import Spinner from "./Spinner";
import { getPokemonsOnScroll } from "../api";

export default function Pokemons() {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const navigateToPokemon = useNavigateToPokemon();

	// cache data
	const cachedDispaly = useMemo(() => {
		return state.display.map(id => Object.values(state.pokemons).find(pokemon => pokemon.id === id));
	}, [state.display, state.pokemons]);
	const cachedSpecies = useCachedData(state.pokemonSpecies);
	const cachedLanguage = useCachedData(state.language);
	const cachedTypes = useCachedData(state.types);

	const handleScroll = useCallback(() => {
		if (window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight && state.status === 'idle' && state.nextRequest !== null) {
			getPokemonsOnScroll(dispatch, state.nextRequest, state.pokemons, state.display);
		};
	}, [state.status, state.nextRequest, state.pokemons, state.display, dispatch]);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);
	console.log(state)

	let content;
	if (state.status === 'loading') {
		content = <Spinner />
	} else if (state.status === 'idle' && cachedDispaly.length === 0) {
		content = <p className="text-center">No Pokémons to show</p>
	} else if (state.status === 'idle' || state.status === 'scrolling') {
		content = (
			<>
				{cachedDispaly.map(pokemon => (
					<div 
						key={pokemon.id} 
						className="col-6 col-md-4 col-lg-3 card pb-3 pokemonCard" 
						onClick={() => navigateToPokemon(state, dispatch, [pokemon.id],['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items'])}
					>
						<BasicInfo
							pokemon={pokemon}
							cachedLanguage={cachedLanguage}
							cachedSpecies={cachedSpecies}
							cachedTypes={cachedTypes}
						/>
					</div>
				))}
				<ScrollToTop />
				{state.status === 'scrolling' && <Spinner />}
			</>
		)
	};

	return (
		<>
			<div className="container">
				<Sort status={state.status}/>
				<div className="row g-5">
					{content}
				</div>
			</div>
		</>
	)
};