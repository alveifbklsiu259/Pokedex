import { useEffect, useCallback, useMemo } from "react";
import { usePokemonData, useDispatchContenxt, useCachedData, useNavigateToPokemon } from "./PokemonsProvider";
import Sort from "./Sort";
import BasicInfo from "./BasicInfo";
import PokemonTable from "./PokemonTable";
import ScrollToTop from "./ScrollToTop";
import Spinner from "./Spinner";
import ViewMode from "./ViewMode";
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
		if (state.viewMode === 'module') {
			window.addEventListener('scroll', handleScroll);
			return () => window.removeEventListener('scroll', handleScroll);
		}
	}, [handleScroll, state.viewMode]);

	const noMatchContent = useMemo(() => <p className="text-center">No Matched Pokémons</p>, []);


	let moduleContent, listContent;
	if (state.status === 'loading') {
		moduleContent = <Spinner />
	} else if (state.status === 'idle' && cachedDispaly.length === 0) {
		moduleContent = noMatchContent;
	} else if (state.status === 'idle' || state.status === 'scrolling') {
		moduleContent = (
			<>
				{cachedDispaly.map(pokemon => (
					<div 
						key={pokemon.id}
						className="col-6 col-md-4 col-lg-3 card pb-3 pokemonCard"
						onClick={() => navigateToPokemon(state, dispatch, [pokemon.id],['pokemons', 'pokemonSpecies', 'evolutionChains','abilities', 'items'])}
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

	if (state.intersection.length) {
		// when search result changes, pokemonTable's page will stay the same(which is not desired, we want to reset to the first page), provide a key to cause re-render.
		listContent = < PokemonTable key={JSON.stringify(state.intersection)}/>;
	} else {
		listContent = noMatchContent;
	};

	// srcollintoView

	return (
		<>
			<div className="container">
			<ViewMode />
				{
					state.viewMode === 'module'? (
						<>
							<Sort status={state.status}/>
							<div className="row g-5">
								{moduleContent}
							</div>
						</>
				) : listContent
				}
			</div>
		</>
	)
};