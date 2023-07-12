import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import BasicInfo from "./BasicInfo";
import Detail from "./Detail";
import Stats from "./Stats";
import EvolutionChains from "./EvolutionChains";
import Spinner from "./Spinner";
import ScrollToTop from "./ScrollToTop";
import Moves from "./Moves";
import ErrorPage from "./ErrorPage";
import Varieties from "./Varieties";
import { usePokemonData, useDispatchContenxt, useCachedData } from "./PokemonsProvider";
import { getDataToFetch, getData, getAbilitiesToDisplay, getAbilities, getChainData } from "../api";
import { getIdFromURL } from "../util";

export default function Pokemon() {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const {pokeId} = useParams();

	// enable search pokemon by names in url (english)
	let urlParam = pokeId;
	if (isNaN(Number(pokeId))) {
		// if we can't find the corresponding id, use what it is, router will handle error.
		urlParam = state.allPokemonNamesAndIds[pokeId.toLowerCase()] || pokeId;
	};

	// pokemon data fot current page
	const pokemon = state.pokemons[urlParam];
	let speciesInfo = useMemo(()=> state.pokemonSpecies[urlParam], [state.pokemonSpecies, urlParam]);
	// for different forms (any non-default-form pokemon uses its default-form's species data rather than data from 'pokemon-species/[pokeId]').
	if (!speciesInfo && pokemon?.is_default === false) {
		speciesInfo = state.pokemonSpecies[getIdFromURL(pokemon.species.url)];
	};
	// evolution chains
	const evolutionChainsURL = speciesInfo?.evolution_chain?.url;
	const chainId = evolutionChainsURL ? getIdFromURL(evolutionChainsURL) : undefined;
	const evolutionChains = state.evolutionChains?.[chainId]?.chains;

	// abilities, only required when language is not 'en'.
	let abilitiesToDisplay, isAbilitiesReady;
	if (state.language !== 'en') {
		abilitiesToDisplay = getAbilitiesToDisplay([pokemon]);
		isAbilitiesReady = abilitiesToDisplay ? abilitiesToDisplay.every(ability => state.abilities[ability]) : false;
	};

	// cache data for better performance, we can opt out this approach if switching to redux
	const cachedPokemons = useCachedData(state.pokemons);
	const cachedAbilities = useCachedData(state.abilities);
	const cachedEvolutionChains = useCachedData(state.evolutionChains);
	const cachedLanguage = useCachedData(state.language);
	const cachedSpecies = useCachedData(state.pokemonSpecies);
	const cachedTypes = useCachedData(state.types);
	const cachedStats = useCachedData(state.stats);
	const cachedItems = useCachedData(state.items);

	const requiredData = [pokemon, speciesInfo, evolutionChains];
	const isDataReady = state.language === 'en' ? requiredData.every(Boolean) : (requiredData.every(Boolean) && isAbilitiesReady);
	
	// evolutionDetails --> fetch items
	// console.log(state)



	// go back to checking EvolutionDetails after optimalizing NavBar/LanguageMenu fron Pokemons.js

	// can i cahnge the way modal dispaly? instead of hiding it, only show it when isModalShown is true.
	// optimize other modal dispaly in pokemon
	// translate height, weight, stats,
	//A form field element should have an id or name attribute

	// when switching to redux, we can read state.display in Navbar to determin if we want to reset scroll position when click back to root.

	// can we use window.location to replace useParams?

	// in evolutionchain, see if we can put the right image , for example wooper has two chain, the second should be it's paldea form

	// see if we can add a click event in Pokemons.js, fetch data before navigating, then we will not use the Effect in Pokemon.js
// console.log(state)

	console.log(state)
	useEffect(() => {
		// PokemonProvider also fetches data when it mounts, to avoid race condition, only fetch data when PokemonProvider's request is done. (since the dispatches in PokemonProvider are batched intentionally, status will only become "idle" when all requests in it are done.)
		// To reduce unnecessary re-renders of this component, I think it would be great if we could find a way to batch dispatched between this Effect and the Effect from PokemonProvider, but since the re-renders are mainly caused by Context API, and I decided to migrate to Redux later, I'll just leave it as it is.
		if (!isDataReady && state.status === 'idle') {
			// console.log('eff')
			const getPokemonData = async () => {
				dispatch({type: 'dataLoading'});
				let pokemonData, speciesData, chainsData, pokemonsFromChain, fetchedAbilities;

				try {
					if (!pokemon) {
						pokemonData = await getData('pokemon', urlParam);
						// get form data if this pokemon is not the default form, form data is for Moves.js
						// this is for the case when directly loading non-default-form pokemon page, otherwise form data should be fetched when switching form tab.
						if (!pokemonData.is_default) {
							const formData = await getData('pokemon-form', pokemonData.forms[0].url);
							pokemonData.formData = formData;
						};
					};
					if (!speciesInfo) {
						speciesData = await getData('pokemon-species', pokemonData ? pokemonData.species.url : pokemon.species.url);
					};
					if (!evolutionChains) {
						[chainsData, pokemonsFromChain] = await getChainData((speciesData || speciesInfo).evolution_chain.url, state.pokemons, pokemonData);
					};

					if (state.language !== 'en' && !isAbilitiesReady) {
						// fetchedAbilities = await getData('ability', abilitiesToFetch, 'name');
						fetchedAbilities = await getAbilities([pokemon || pokemonData], state.abilities);
						console.log(fetchedAbilities)
					};
	
					// to batch dispatches
					if (pokemonData) {
						dispatch({type: 'pokemonsLoaded', payload: {data: {[pokemonData.id]: pokemonData}, nextRequest: 'unchanged'}});
					};
					if (speciesData) {
						dispatch({type: 'pokemonSpeciesLoaded', payload: {[speciesData.id]: speciesData}});
					};
					if (chainsData) {
						dispatch({type: 'evolutionChainsLoaded', payload: {
							[getIdFromURL((speciesData || speciesInfo).evolution_chain.url)] : {
								chains: chainsData.sortedChains,
								details: chainsData.evolutionDetails
							}
						}});
					};
					if (state.language !== 'en' && fetchedAbilities) {
						dispatch({type: 'abilityLoaded', payload: fetchedAbilities});
					};
					if (pokemonsFromChain && Object.keys(pokemonsFromChain).length) {
						dispatch({type: 'pokemonsLoaded', payload: {data: pokemonsFromChain, nextRequest: 'unchanged'}});
					};
				} catch(err) {
					console.log(err)
					dispatch({type: 'error'});
				}
			};
			getPokemonData();
		};
	}, [pokemon, speciesInfo, evolutionChains, urlParam , dispatch, isDataReady, state.status, state.pokemons, state.language, isAbilitiesReady]);
	let content;
	if (state.status === 'idle' && isDataReady) {
		content = (
			<>
				<div className="container p-0">
					<div className="row justify-content-center">
						{speciesInfo.varieties.length > 1 && (
							<Varieties 
								speciesInfo={speciesInfo}
								pokemon={pokemon}
							/>
						)}
						<div className='basicInfoContainer row col-8 col-sm-6 justify-content-center'>
							<BasicInfo
								pokemon={pokemon}
								// cachedData
								cachedLanguage={cachedLanguage}
								cachedSpecies={cachedSpecies}
								cachedTypes={cachedTypes}
							/>
						</div>
						<Detail
							pokemon={pokemon}
							speciesInfo={speciesInfo}
							cachedAbilities={cachedAbilities}
							cachedLanguage={cachedLanguage}
						/>
						<Stats
							pokemon={pokemon}
							cachedStats={cachedStats}
							cachedLanguage={cachedLanguage}
						/>
						<EvolutionChains
							cachedPokemons={cachedPokemons}
							cachedEvolutionChains={cachedEvolutionChains}
							evolutionChains={evolutionChains}
							chainId={chainId}
							// cachedData
							cachedLanguage={cachedLanguage}
							cachedSpecies={cachedSpecies}
							cachedTypes={cachedTypes}
							cachedItems={cachedItems}
						/>
						{/* <Moves pokemon={pokemon} chainId={chainId} speciesInfo={speciesInfo} key={pokemon.id} /> */}
						<div className="row justify-content-center">
							<Link to='/' className="w-50 m-3 btn btn-block btn-secondary">Explore More Pokemons</Link>
						</div>
					</div>
				</div>
				<ScrollToTop />
			</>
		)
	} else if (state.status === 'loading') {
		content = (
			<div style={{position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
				<Spinner />
			</div>
		)
	} else if (state.status === 'error') {
		content = (
			<ErrorPage />
		)
		throw new Error('error')
	};

	return (
		<>
			{content}
		</>
	)
};