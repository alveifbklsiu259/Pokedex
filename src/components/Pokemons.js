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
					<div key={pokemon.id} className="col-6 col-md-4 col-lg-3 card pb-3 pokemonCard" onClick={() => navigateToPokemon(dispatch, [pokemon.id],['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items'], state)}>
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

// items : pokemons --> pokemon && lang !== 'en' , pokemon --> change language
// when chaing url directly in the url bar, the whole state gets re-set, this is not correct...

// geAbilitiesToDisplay's if (pokemonData === undefined || pokemonData.includes(undefined)) {  seems buggy

// is it a good idea to move getDataToFetch into getData?

	// 1. determin what data is required on the individual page
	// 2. any click that will cause routing shoud check if data is ready
	// 3. if data is not ready, fetch data, then navigate
	// 4. if data is ready, just navigate
	
	// Pokemons.js, EvolutionChains.js, Varieties.js, (the future function of switching to next/previous pokemon)

	// special case, changing language: LanguageMenu.js

	// data we need to check:

	/* 
		1. pokemon(all cases, only required in Varieties.js) 
		2. species(language === 'en')
		3. abilities(language !== 'en') 
		4. evolutionChain(all cases)
		5. items(language !== 'en');
	*/


	// Pokemons: species, chain, chain pokemons, items / lang !== 'en': abilities;
	// Varieties: pokemons / lang !== 'en': abilities;
	// EvolutionChains: species / lang !== 'en': abilities;
	// Pokemon Effect: pokemon, species, chain, chain pokemons, items / lang !== 'en': abilities;

	// LanugaugeMenu: on Pokemon : ability

	// reading state in varieties/evolution doesn't seem cause a lot of overhead?
	// besides, when on /pokemons/xxx, state changes usually is caused by loading new data, which those components will read.

	// the oreder of params, getAbilities , see if you can change to match getDataToFetch, getData....
