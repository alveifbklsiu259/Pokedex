import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import BasicInfo from "./BasicInfo";
import Detail from "./Detail";
import Stats from "./Stats";
import EvolutionChains from "./EvolutionChains";
import { usePokemonData, useDispatchContenxt, useCachedData } from "./PokemonsProvider";
import Spinner from "./Spinner";
import ScrollToTop from "./ScrollToTop";
import { getDataToFetch, getData } from "../api";
import { getIdFromURL, transformToDash, transformToKeyName } from "../util";
import ErrorPage from "./ErrorPage";
import Varieties from "./Varieties";
import Moves from "./Moves";

export default function Pokemon() {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const {pokeId} = useParams();

	// enable search pokemon by names in url (english)
	let urlParam = pokeId;
	if (isNaN(Number(pokeId))) {
		// if we can't find the corresponding id, use what it is, router will handle error
		urlParam = state.allPokemonNamesAndIds[pokeId.toLowerCase()] || pokeId;
	};

	// pokemon data fot current page
	const pokemon = state.pokemons[urlParam];
	let speciesInfo = useMemo(()=> state.pokemonSpecies[urlParam], [state.pokemonSpecies, urlParam]);
	// for different forms, any non-default-form pokemon uses its default-form's species data rather than data from 'pokemon-species/[pokeId]'
	if (!speciesInfo && pokemon?.is_default === false) {
		speciesInfo = state.pokemonSpecies[getIdFromURL(pokemon.species.url)];
	};
	// evolution chains
	const evolutionChainsURL = speciesInfo?.evolution_chain?.url;
	const chainId = evolutionChainsURL ? getIdFromURL(evolutionChainsURL) : undefined;
	const evolutionChains = state.evolutionChains?.[chainId]?.chains;

	// abilities, only required when language is not 'en'
	let abilities, abilitiesToFetch, abilitiesData;

	if (state.language !== 'en') {
		// pokemon may be undefined when switching between form tab.
		const abilitiesArray = pokemon?.abilities?.map(entry => entry?.ability?.name);
		if (abilitiesArray) {
			// there're some duplications from the api
			abilities = [...new Set(abilitiesArray)].map(ability => transformToKeyName(ability));
			abilitiesToFetch = getDataToFetch(state.abilities, abilities).map(ability => transformToDash(ability));
			abilitiesData = abilities.map(ability => state.abilities[ability]);
			if (abilitiesData.includes(undefined)) {
				abilitiesData = undefined;
			};
		};
	};

	// cache data for better performance, we can opt out this approach if switch to using redux
	const cachedPokemons = useCachedData(state.pokemons);
	const cachedNextRequest = useCachedData(state.nextRequest);
	const cachedAbilities = useCachedData(state.abilities);
	const cachedEvolutionChains = useCachedData(state.evolutionChains);
	const cachedLanguage = useCachedData(state.language);
	const cachedSpecies = useCachedData(state.pokemonSpecies);
	const cachedTypes = useCachedData(state.types);
	const cachedStats = useCachedData(state.stats);
	const cachedItems = useCachedData(state.items);


	console.log(state)
	const requiredData = [pokemon, speciesInfo, evolutionChains];
	if (state.language !== 'en') {
		requiredData.push(abilitiesData);
	}
	const isDataReady = requiredData.every(Boolean);
	console.log(isDataReady)
	
	// clicking pokemon in the evolution chain-->
	// 1. go to pokemons/xxx (first render)
	// 2. finds out species data is not ready --> dispatch loading (second render)
	// 3. data ready --> dispatch (third render)


	useEffect(() => {
		// PokemonProvider also fetches data when it mounts, to avoid race condition, only fetch data when PokemonProvider's request is done. (since the dispatches in PokemonProvider are batched intentionally, status will only become "idle" when all requests in it are done.)
		// To reduce unnecessary re-renders of this component, I think it would be great if we could find a way to batch dispatched between this Effect and the Effect from PokemonProvider, but since the re-renders are mainly caused by Context API, and I decided to migrate to Redux later, I'll just leave it as it is.
		if (!isDataReady && state.status === 'idle') {

			const getPokemonData = async () => {
				console.log('inside effect')
				dispatch({type: 'dataLoading'});
				let pokemonData, speciesData, chainsData, fetchedPokemons, fetchedAbilities;

				try {
					if (!pokemon) {
						pokemonData = await getData('pokemon', urlParam);
						// get form data if this pokemon is not the default form, this is for the case when directly loading non-default-form pokemon page, otherwise form data should be fetched when switching variety tab.
						if (!pokemonData.is_default) {
							const formData = await getData('pokemon-form', pokemonData.forms[0].url);
							pokemonData.formData = formData;
						};
					};
					if (!speciesInfo) {
						speciesData = await getData('pokemon-species', pokemonData ? pokemonData.species.url : pokemon.species.url);
					};
					if (!evolutionChains) {
						const getEvolutionChains = async () => {
							const response = await fetch(speciesData?.evolution_chain?.url || speciesInfo.evolution_chain.url);
							const data = await response.json();

							// get chains, details
							let evolutionDetails = {};
							let chainIds = [];
							let index = 0;
							let depth = 1;
							chainIds[index] = {};
							const getIdsFromChain = chains => {
								// get details
								if (chains.evolution_details.length) {
									evolutionDetails[getIdFromURL(chains.species.url)] = chains.evolution_details;
								};
								// get ids
								chainIds[index][`depth-${depth}`] = getIdFromURL(chains.species.url);
								if (chains.evolves_to.length) {
									depth ++;
									chains.evolves_to.forEach((chain, index, array) => {
										getIdsFromChain(chain);
										// the last chain in each depth
										if (index === array.length - 1) {
											depth --;
										};
									});
								} else {
									if (index !== 0) {
										const minDepth = Number(Object.keys(chainIds[index])[0].split('-')[1]);
										for (let i = 1; i < minDepth; i++) {
											// get pokemon ids from the prvious chain, since they share the same pokemon(s)
											chainIds[index][`depth-${i}`] = chainIds[index - 1][`depth-${i}`];
										};
									};
									index ++;
									chainIds[index] = {};
								};
							};
							getIdsFromChain(data.chain);
							chainIds.pop();
			
							// sort chains
							const sortedChains = chainIds.map(chain => {
								const sortedKeys = Object.keys(chain).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
								const sortedChain = sortedKeys.reduce((previousReturn, currentElement) => {
									previousReturn[currentElement] = chain[currentElement];
									return previousReturn;
								}, {});
								return Object.values(sortedChain);
							});
							return {sortedChains, evolutionDetails};
						};
						chainsData = await getEvolutionChains();

						// get pokemon data from the chain(s)
						const pokemonsInChain = new Set(chainsData.sortedChains.flat());

						let currentCachedPokemons;
						if (pokemonData) {
							currentCachedPokemons = {...cachedPokemons, ...{[pokemonData.id]: pokemonData}};
						} else {
							currentCachedPokemons = cachedPokemons;
						};
						const pokemonsToFetch = getDataToFetch(currentCachedPokemons, [...pokemonsInChain]);
						fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
					};

					if (state.language !== 'en' && !abilitiesData) {
						fetchedAbilities = await getData('ability', abilitiesToFetch, 'name');
					};
	
					// to batch dispatches
					if (pokemonData) {
						dispatch({type: 'individualPokemonLoaded', payload: pokemonData});
					};
					if (speciesData) {
						dispatch({type: 'pokemonSpeciesLoaded', payload: {[speciesData.id]: speciesData}});
					};
					if (chainsData) {
						dispatch({type: 'evolutionChainsLoaded', payload: {
							id: getIdFromURL(speciesData?.evolution_chain?.url || speciesInfo.evolution_chain.url),
							chains: chainsData.sortedChains,
							details: chainsData.evolutionDetails
						}});
					};
					if (state.language !== 'en' && fetchedAbilities) {
						dispatch({type: 'abilityLoaded', payload: fetchedAbilities});
					};
					if (fetchedPokemons && Object.keys(fetchedPokemons).length) {
						dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: cachedNextRequest}});
					};
				} catch {
					dispatch({type: 'error'});
				}
			};
			getPokemonData();
		};
	}, [pokemon, speciesInfo, evolutionChains, urlParam , dispatch, isDataReady, cachedNextRequest, state.status, cachedPokemons, state.language, abilitiesToFetch, abilitiesData]);
	let content;
	if (state.status === 'idle' && isDataReady) {
		content = (
			<>
				<div className="container p-0">
					<div className="row justify-content-center">
						{speciesInfo.varieties.length > 1 && <Varieties speciesInfo={speciesInfo} pokemon={pokemon} cachedLanguage={cachedLanguage} cachedNextRequest={cachedNextRequest} cachedPokemons={cachedPokemons}/>}
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