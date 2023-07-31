import { useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectPokeData, selectPokemons, selectDisplay, selectNextRequest, selectStatus, selectViewMode, selectIntersection, getPokemonsOnScroll } from "../features/pokemonData/pokemonDataSlice";
import { useNavigateToPokemon } from "../api";
import Sort from "./Sort";
import BasicInfo from "./BasicInfo";
import PokemonTable from "./PokemonTable";
import ScrollToTop from "./ScrollToTop";
import Spinner from "./Spinner";
import ViewMode from "./ViewMode";

export default function Pokemons() {
	const dispatch = useDispatch();
	const navigateToPokemon = useNavigateToPokemon();
	const pokemons = useSelector(selectPokemons);
	const display = useSelector(selectDisplay);
	const nextRequest = useSelector(selectNextRequest);
	const status = useSelector(selectStatus);
	const viewMode = useSelector(selectViewMode);
	const intersection = useSelector(selectIntersection);
	
	const cachedDispaly = useMemo(() => {
		return display.map(id => Object.values(pokemons).find(pokemon => pokemon.id === id));
	}, [display, pokemons]);

	const handleScroll = useCallback(() => {
		if (window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight && status === 'idle' && nextRequest !== null) {
			dispatch(getPokemonsOnScroll());
		};
	}, [status, nextRequest, dispatch]);

	useEffect(() => {
		if (viewMode === 'module') {
			window.addEventListener('scroll', handleScroll);
			return () => window.removeEventListener('scroll', handleScroll);
		};
	}, [handleScroll, viewMode]);

	const noMatchContent = useMemo(() => <p className="text-center">No Matched Pokémons</p>, []);

	let moduleContent, tableContent;
	if (status === 'loading') {
		moduleContent = <Spinner />
	} else if (status === 'idle' && cachedDispaly.length === 0) {
		moduleContent = noMatchContent;
	} else if (status === 'idle' || status === 'scrolling') {
		moduleContent = (
			<>
				{
					cachedDispaly.map(pokemon => (
						<div 
							key={pokemon.id}
							className="col-6 col-md-4 col-lg-3 card pb-3 pokemonCard"
							onClick={() => navigateToPokemon([pokemon.id],['pokemons', 'pokemonSpecies', 'evolutionChains','abilities', 'items'])}
						>
							<BasicInfo pokemon={pokemon} />
						</div>
					))
				}
				<ScrollToTop />
				{status === 'scrolling' && <Spinner />}
			</>
		)
	};

	if (status === 'loading') {
		tableContent = <Spinner />
	} else if (intersection.length) {
		// when search result changes, pokemonTable's page will stay the same(which is not desired, we want to reset to the first page), provide a key to cause re-render.
		tableContent = <PokemonTable key={JSON.stringify(intersection)}/>;
	} else {
		tableContent = noMatchContent;
	};

	return (
		<>
			<div className="container">
			<ViewMode />
				{
					viewMode === 'module'? (
						<>
							<Sort />
							<div className="row g-5">
								{moduleContent}
							</div>
						</>
				) : tableContent
				}
			</div>
		</>
	)
};
	// cache viewMode, sort component.
	// html title...
	// is it possible to batch thunk dispatch with regular action dispatch? (seems not possible, more experiments are needed.)