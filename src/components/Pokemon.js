import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import BasicInfo from "./BasicInfo";
import Detail from "./Detail";
import Stats from "./Stats";
import EvolutionChains from "./EvolutionChains";
import { usePokemonData, useDispatchContenxt } from "./PokemonsProvider";
import Spinner from "./Spinner";
import ScrollToTop from "./ScrollToTop";
import { getIndividualtData, getPokemonsToFetch, getMultiplePokemons } from "../api";
import { getIdFromURL } from "../util";
import ErrorPage from "./ErrorPage";
import Varieties from "./Varieties";

export default function Pokemon() {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const {pokeId} = useParams();

	// pokemon data fot current page
	const pokemon = state.pokemons[pokeId];
	let speciesInfo = state.pokemonSpecies[pokeId];
	// for different forms, any non-default-form pokemon uses its default-form's species data rather than data from 'pokemon-species/[pokeId]'
	if (!speciesInfo && pokemon) {
		speciesInfo =  state.pokemonSpecies[getIdFromURL(pokemon.species.url)];
	};

	// evolution chains
	const evolutionChainsURL = speciesInfo?.evolution_chain?.url;
	const chainId = evolutionChainsURL ? getIdFromURL(evolutionChainsURL) : undefined;
	const evolutionChains = state.evolutionChains?.[chainId]?.chains;

	const isDataReady = [pokemon, speciesInfo, evolutionChains].every(Boolean);

	useEffect(() => {
		// PokemonProvider also fetches data when it mounts, to avoid race condition, only fetch data when PokemonProvider's request is done. (since the dispatches in PokemonProvider are batched intentionally, status will only become "idle" when all requests in it are done.)
		// To reduce unnecessary re-renders of this component, I think it would be great if we could find a way to batch dispatched between this Effect and the Effect from PokemonProvider, but since the re-renders are mainly caused by Context API, and I decided to migrate to Redux later, I'll just leave it as it is.
		if (!isDataReady && state.status === 'idle') {
			const getData = async () => {
				dispatch({type: 'dataLoading'});
				let pokemonData, speciesData, chainsData, fetchedPokemons;

				try {
					if (!pokemon) {
						pokemonData = await getIndividualtData('pokemon', pokeId);
					};
					if (!speciesInfo) {
						speciesData = await getIndividualtData('pokemon-species', getIdFromURL(pokemonData ? pokemonData.species.url : pokemon.species.url));
						// get evolution chains
						if (!evolutionChains) {
							const getEvolutionChains = async () => {
								const response = await fetch(speciesData.evolution_chain.url);
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

							let cachedPokemons;
							if (pokemonData) {
								cachedPokemons = {...state.pokemons, ...{[pokemonData.id]: pokemonData}};
							} else {
								cachedPokemons = state.pokemons;
							};
							const pokemonsToFetch = getPokemonsToFetch(cachedPokemons, [...pokemonsInChain]);
							fetchedPokemons = await getMultiplePokemons(pokemonsToFetch);
						};
					};
	
					// to batch dispatches
					if (pokemonData) {
						dispatch({type: 'individualPokemonLoaded', payload: pokemonData});
					};
					if (speciesData) {
						dispatch({type: 'pokemonSpeciesLoaded', payload: speciesData});
					};
					if (chainsData) {
						dispatch({type: 'evolutionChainsLoaded', payload: {
							id: getIdFromURL(speciesData.evolution_chain.url),
							chains: chainsData.sortedChains,
							details: chainsData.evolutionDetails
						}});
					};
					if (fetchedPokemons && Object.keys(fetchedPokemons).length) {
						dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: state.nextRequest}});
					};
				} catch {
					dispatch({type: 'error'});
				}
			};
			getData();
		};
	}, [pokemon, speciesInfo, evolutionChains, pokeId ,state.pokemons, dispatch, isDataReady, state.nextRequest, state.status]);
	let content;
	if (state.status === 'idle' && isDataReady) {
		content = (
			<>
				<div className="container p-0">
					<div className="row justify-content-center">
						{speciesInfo.varieties.length > 1 && <Varieties speciesInfo={speciesInfo} pokemon={pokemon} />}
						<div className='basicInfoContainer row col-8 col-sm-6 justify-content-center'>
							<BasicInfo pokemon={pokemon}/>
						</div>
						<Detail pokemon={pokemon} speciesInfo={speciesInfo} />
						<Stats pokemon={pokemon}/>
						<EvolutionChains cachedPokemons={state.pokemons} evolutionChains={evolutionChains} chainId={chainId} />
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