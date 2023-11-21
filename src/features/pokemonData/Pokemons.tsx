import { useEffect, useMemo, useRef } from "react";
import { shallowEqual } from "react-redux";
import { selectPokemons, getPokemonsOnScroll, selectSpecies } from "./pokemonDataSlice";
import { selectDisplay, selectNextRequest, selectStatus, selectViewMode, selectIntersection, selectLanguage, type SortOption } from "../display/displaySlice";
import { getDataToFetch, useNavigateToPokemon, usePrefetch } from "../../api";
import Sort from "../display/Sort"
import BasicInfo from "./BasicInfo";
import PokemonTable from "./PokemonTable";
import ScrollToTop from "../../components/ScrollToTop";
import Spinner from "../../components/Spinner";
import ViewMode from "../display/ViewMode";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getIdFromURL } from "../../util";

export type TableInfoRefTypes = {
	sortBy?: SortOption
	page?: number
	rowsPerPage?: number
};

type PokemonProps = {
	viewModeRef: React.RefObject<HTMLDivElement>
}


export default function Pokemons({viewModeRef}: PokemonProps) {
	const dispatch = useAppDispatch();
	const navigateToPokemon = useNavigateToPokemon();
	const [unresolvedDataRef, prefetch] = usePrefetch('scroll');
	const pokemons = useAppSelector(selectPokemons);
	const species = useAppSelector(selectSpecies);
	const display = useAppSelector(selectDisplay, shallowEqual);
	const nextRequest = useAppSelector(selectNextRequest, shallowEqual);
	const status = useAppSelector(selectStatus);
	const viewMode = useAppSelector(selectViewMode);
	const intersection = useAppSelector(selectIntersection, shallowEqual);
	const language = useAppSelector(selectLanguage);
	const tableInfoRef = useRef<TableInfoRefTypes>({});

	const cachedDispaly = useMemo(() => {
		return display.map(id => pokemons[id]);
	}, [display, pokemons]);

	useEffect(() => {
		if (viewMode === 'module') {
			const handleScroll = () => {
				if (window.innerHeight + document.documentElement.scrollTop > document.documentElement.offsetHeight * 0.8 && status === 'idle' && nextRequest !== null) {
					const pokemonsToDisplay = [...nextRequest].splice(0, 24);
					const pokemonsToFetch = getDataToFetch(pokemons, pokemonsToDisplay);
					if (unresolvedDataRef.current === null && pokemonsToFetch.length) {
						prefetch(pokemonsToFetch);
					};
				};
		
				if (window.innerHeight + document.documentElement.scrollTop > document.documentElement.offsetHeight * 0.98 && status === 'idle' && nextRequest !== null) {
					dispatch(getPokemonsOnScroll({unresolvedData: unresolvedDataRef.current}));
				};
			};
			window.addEventListener('scroll', handleScroll);
			return () => {
				window.removeEventListener('scroll', handleScroll);
				// prevent stale data when search pokemons after scrolling.
				unresolvedDataRef.current = null;
			};
		};
	}, [nextRequest, status, viewMode, pokemons, unresolvedDataRef, dispatch, prefetch]);

	const noMatchContent = useMemo(() => <p className="text-center">No Matched Pokemons</p>, []);
	let moduleContent: React.JSX.Element, tableContent: React.JSX.Element;
	if (status === 'loading' || status === null) {
		moduleContent = <Spinner />;
	} else if (status === 'idle' && cachedDispaly.length === 0) {
		moduleContent = noMatchContent;
	} else if (status === 'idle' || status === 'scrolling') {
		moduleContent = (
			<>
				{
					cachedDispaly.map(pokemon => {
						const navigateIds = language !== 'en' ? species[pokemon.id].varieties.map(variety => getIdFromURL(variety.pokemon.url)) : [pokemon.id];
						return (
							<div 
								key={pokemon.id}
								className="col-6 col-md-4 col-lg-3 card pb-3 pokemonCard"
								onClick={() => navigateToPokemon(navigateIds,['pokemon', 'pokemonSpecies', 'evolutionChain', 'ability', 'item'])}
							>
								<BasicInfo pokeId={String(pokemon.id)} />
							</div>
						)
					})
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
		tableContent = <PokemonTable key={JSON.stringify(intersection)} tableInfoRef={tableInfoRef} viewModeRef={viewModeRef}/>;
	};

	return (
		<>
			<div className="container">
			<div ref={viewModeRef} className="viewModeContainer">
				<ViewMode tableInfoRef={tableInfoRef} />
			</div>
			
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