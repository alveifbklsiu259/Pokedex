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

export default function Pokemon() {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const {pokeId} = useParams();

	// pokemon data fot current page
	const pokemon = state.pokemons[pokeId];
	const speciesInfo = state.pokemonSpecies[pokeId];

	// evolution chains
	const evolutionChainsURL = speciesInfo?.evolution_chain?.url;
	const chainId = evolutionChainsURL ? getIdFromURL(evolutionChainsURL) : undefined;
	const evolutionChains = state.evolutionChains?.[chainId];

	const isDataReady = [pokemon, speciesInfo, evolutionChains].every(Boolean);
	useEffect(() => {
		if (!isDataReady) {
			let ignore = false;
			const getData = async () => {
				dispatch({type: 'dataLoading'});
				let pokemonData, speciesData, chainsData, fetchedPokemons;
				if (!pokemon) {
					pokemonData = await getIndividualtData('pokemon', pokeId);
				};
				if (!speciesInfo) {
					speciesData = await getIndividualtData('pokemon-species', pokeId);
					// get evolution chains
					if (!evolutionChains) {
						const getEvolutionChains = async () => {
							const response = await fetch(speciesData.evolution_chain.url);
							const data = await response.json();

							// get chains
							let chainIds = [];
							let index = 0;
							let depth = 1;
							chainIds[index] = {};
							const getIdsFromChain = chains => {
								// get ids
								chainIds[index][`depth-${depth}`] = getIdFromURL(chains.species.url)
								if (chains.evolves_to.length) {
									depth ++;
									chains.evolves_to.forEach((chain, index, array) => {
										getIdsFromChain(chain);
										if (index === array.length - 1) {
											depth --;
										};
									});
								} else {
									if (index !== 0) {
										const minDepth = Number(Object.keys(chainIds[index])[0].split('-')[1]);
										for (let i = 1; i < minDepth; i++) {
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
							return sortedChains;
						};
						chainsData = await getEvolutionChains();

						// get pokemon data from the chain(s)
						const pokemonsInChain = new Set(chainsData.flat());
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
				if (!ignore) {
					if (pokemonData) {
						dispatch({type: 'individualPokemonLoaded', payload: pokemonData});
					};
					if (speciesData) {
						dispatch({type: 'pokemonSpeciesLoaded', payload: speciesData});
					};
					if (chainsData) {
						dispatch({type: 'evolutionChainsLoaded', payload: {id: getIdFromURL(speciesData.evolution_chain.url), chains: chainsData}});
					};
					if (fetchedPokemons && Object.keys(fetchedPokemons).length) {
						dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: state.nextRequest}});
					};
				} else {
					dispatch({type: 'cancelEffect'});
				};
			};
			getData();

			return (() => {ignore = true});
		};
	}, [pokemon, speciesInfo, evolutionChains, pokeId ,state.pokemons, dispatch, isDataReady, state.nextRequest]);
	console.log(state)
	let content;
	if (state.status === 'idle' && isDataReady) {
		content = (
			<>
				<div className="container p-0">
					<div className="row justify-content-center">
						<div className='basic-info row col-8 col-sm-6 justify-content-center'>
							<BasicInfo pokemon={pokemon}/>
						</div>
						<Detail pokemon={pokemon} speciesInfo={speciesInfo} />
						<Stats pokemon={pokemon}/>
						<EvolutionChains cachedPokemons={state.pokemons} evolutionChains={evolutionChains}/>
						<div className="row justify-content-center">
							<Link to='/' className="w-50 m-3 btn btn-block btn-secondary">Explore More Pokemons</Link>
						</div>
					</div>
				</div>
				<ScrollToTop />
			</>
		)
	} else {
		content = <Spinner />
	};

	return (
		<>
			{content}
		</>
	)
};