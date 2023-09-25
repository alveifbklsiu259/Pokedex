import { useEffect, useCallback, useMemo, useRef } from "react";
import { shallowEqual } from "react-redux";
import { selectPokemons, getPokemonsOnScroll } from "./pokemonDataSlice";
import { selectDisplay, selectNextRequest, selectStatus, selectViewMode, selectIntersection, type SortOption } from "../display/displaySlice";
import { useNavigateToPokemon } from "../../api";
import Sort from "../display/Sort"
import BasicInfo from "./BasicInfo";
import PokemonTable from "./PokemonTable";
import ScrollToTop from "../../components/ScrollToTop";
import Spinner from "../../components/Spinner";
import ViewMode from "../display/ViewMode";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import type { Pokemon } from "../../../typeModule";

export type TableInfoRefTypes = {
	sortBy?: SortOption
	page?: number
	rowsPerPage?: number
};

export default function Pokemons() {
	const dispatch = useAppDispatch();
	const navigateToPokemon = useNavigateToPokemon();
	const pokemons = useAppSelector(selectPokemons);
	const display = useAppSelector(selectDisplay, shallowEqual);
	const nextRequest = useAppSelector(selectNextRequest, shallowEqual);
	const status = useAppSelector(selectStatus);
	const viewMode = useAppSelector(selectViewMode);
	const tableInfoRef = useRef<TableInfoRefTypes>({});
	const intersection = useAppSelector(selectIntersection, shallowEqual);

	const cachedDispaly = useMemo(() => {
		return display.map(id => Object.values(pokemons).find(pokemon => pokemon.id === id)) as Pokemon.Root[];
	}, [display, pokemons]);


	const handleScroll = useCallback(() => {
		// if we zoom out, window.innerHeight + document.documentElement.scrollTop === document.documentElement.offsetHeight will very likely never be true.
		if (window.innerHeight + document.documentElement.scrollTop > document.documentElement.offsetHeight * 0.98 && status === 'idle' && nextRequest !== null) {
			dispatch(getPokemonsOnScroll());
		};
	}, [status, nextRequest, dispatch]);

	useEffect(() => {
		// payload, meta.requestId, meta.arg, erro
		if (viewMode === 'module') {
			window.addEventListener('scroll', handleScroll);
			return () => window.removeEventListener('scroll', handleScroll);
		};
	}, [handleScroll, viewMode]);

	const noMatchContent = useMemo(() => <p className="text-center">No Matched Pokémons</p>, []);
	let moduleContent: React.JSX.Element, tableContent: React.JSX.Element;
	if (status === 'loading' || status === null) {
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
							onClick={() => navigateToPokemon([pokemon.id],['pokemon', 'pokemonSpecies', 'evolutionChain','ability', 'item'])}
						>
							<BasicInfo pokeId={String(pokemon.id)} />
						</div>
					))
				}
				<ScrollToTop />
				{status === 'scrolling' && <Spinner />}
			</>
		)
	} else {
		throw new Error();
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