import { useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { selectPokemons, getPokemonsOnScroll } from "./pokemonDataSlice";
import { selectDisplay, selectNextRequest, selectStatus, selectViewMode, selectIntersection } from "../display/displaySlice";
import { useNavigateToPokemon } from "../../api";
import Sort from "../display/Sort"
import BasicInfo from "./BasicInfo";
import PokemonTable from "./PokemonTable";
import ScrollToTop from "../../components/ScrollToTop";
import Spinner from "../../components/Spinner";
import ViewMode from "../display/ViewMode";

export default function Pokemons() {
	const dispatch = useDispatch();
	const navigateToPokemon = useNavigateToPokemon();
	const pokemons = useSelector(selectPokemons);
	const display = useSelector(selectDisplay, shallowEqual);
	const nextRequest = useSelector(selectNextRequest, shallowEqual);
	const status = useSelector(selectStatus);
	const viewMode = useSelector(selectViewMode);
	const tableInfoRef = useRef({});
	const intersection = useSelector(selectIntersection, shallowEqual);

	const cachedDispaly = useMemo(() => {
		return display.map(id => Object.values(pokemons).find(pokemon => pokemon.id === id));
	}, [display, pokemons]);

	const handleScroll = useCallback(() => {
		// if we zoom out, window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight will very likely never be true.
		if (window.innerHeight + document.documentElement.scrollTop > document.documentElement.offsetHeight * 0.98 && status === 'idle' && nextRequest !== null) {
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
		moduleContent = <Spinner />;
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
							<BasicInfo pokeId={pokemon.id} />
						</div>
					))
				}
				<ScrollToTop />
				{status === 'scrolling' && <Spinner />}
			</>
		)
	};

	if (status === 'loading') {
		tableContent = <Spinner />;
	} else {
		tableContent = <PokemonTable key={JSON.stringify(intersection)} tableInfoRef={tableInfoRef}/>;
	};

	return (
		<>
			<div className="container">
			<ViewMode tableInfoRef={tableInfoRef} />
				{
					viewMode === 'module' ? (
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