import { useEffect } from "react";
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
import { usePokemonData, useDispatchContenxt, useCachedData, useNavigateToPokemon } from "./PokemonsProvider";
import { getAbilitiesToDisplay, getRequiredData, getItemsFromChain } from "../api";
import { getIdFromURL, transformToKeyName } from "../util";

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

	// the reason why searching in other languages doesn't work is because even if we change lange, the get the latest data in allPokemonNamesAndIds, when we enter what we type in the url bar, the whole state gets reset, and we're back to English name id pairs. maybe the workaround would be in the PokemonProviders, if language !== 'en', we have to change name id pairs there.


	// required data for current page
	const pokemon = state.pokemons[urlParam];
	const speciesInfo = state.pokemonSpecies[getIdFromURL(pokemon?.species?.url)];
	const chainId = getIdFromURL(speciesInfo?.evolution_chain?.url);
	const evolutionChains = state.evolutionChains?.[chainId];
	const requiredItems = getItemsFromChain(evolutionChains);

	let abilitiesToDisplay, isAbilitiesReady, isItemsReady;
	if (state.language !== 'en') {
		abilitiesToDisplay = getAbilitiesToDisplay(pokemon);
		isAbilitiesReady = abilitiesToDisplay ? abilitiesToDisplay.every(ability => state.abilities[ability]) : false;
		isItemsReady = requiredItems ? requiredItems.every(item => state.items[transformToKeyName(item)]) : false;
	};

	// cache data for better performance, we can opt out this approach if switching to redux
	const cachedPokemons = useCachedData(state.pokemons);
	const cachedAbilities = useCachedData(state.abilities);
	const cachedEvolutionChains = useCachedData(state.evolutionChains);
	const cachedLanguage = useCachedData(state.language);
	const cachedSpecies = useCachedData(state.pokemonSpecies);
	const cachedTypes = useCachedData(state.types);
	const cachedStat = useCachedData(state.stat);
	const cachedItems = useCachedData(state.items);
	const defaultRequiredData = [pokemon, speciesInfo, evolutionChains];
	const isDataReady = state.language === 'en' ? defaultRequiredData.every(Boolean) : (defaultRequiredData.every(Boolean) && isAbilitiesReady && isItemsReady);
	useEffect(() => {
		// PokemonProvider also fetches data when it mounts, to avoid race condition, only fetch data when PokemonProvider's request is done. (since the dispatches in PokemonProvider are batched intentionally, status will only become "idle" when all requests in it are done.)
		// To reduce unnecessary re-renders of this component, I think it would be great if we could find a way to batch dispatched between this Effect and the Effect from PokemonProvider, but since the re-renders are mainly caused by Context API, and I decided to migrate to Redux later, I'll just leave it as it is.
		if (!isDataReady && state.status === 'idle') {
			console.log('eff')
			const getIndividualPokemonData = async () => {
				
				try {
					await getRequiredData(state, dispatch, [urlParam], ['pokemons', 'pokemonSpecies', 'evolutionChains']);
				} catch(err) {
					console.log(err)
					dispatch({type: 'error'});
				};
			}
			getIndividualPokemonData();
		};
	}, [dispatch, isDataReady, state, urlParam]);

	// on Pokemons, sort by names, change language should re-sort the order.

	const pokemonCount = state.pokemonCount;
	const nationalNumber = getIdFromURL(state.pokemons[urlParam]?.species?.url);
	const nextPokemonId = nationalNumber === pokemonCount ? 1 : nationalNumber + 1;
	const previousPokemonId = nationalNumber === 1 ? pokemonCount : nationalNumber - 1;

	let content;
	if (state.status === 'idle' && isDataReady) {
		content = (
			<>
				<RelatedPokemon pokemonId={previousPokemonId} order='previous'/>
				<RelatedPokemon pokemonId={nextPokemonId} order='next'/>
				<div className={`container p-0 ${speciesInfo.varieties.length > 1 ? "marginWithVarieties" : 'marginWithoutVarieties'} `}>
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
							cachedStat={cachedStat}
							cachedLanguage={cachedLanguage}
						/>
						<EvolutionChains
							cachedPokemons={cachedPokemons}
							cachedEvolutionChains={cachedEvolutionChains}
							evolutionChains={evolutionChains.chains}
							chainId={chainId}
							// cachedData
							cachedLanguage={cachedLanguage}
							cachedSpecies={cachedSpecies}
							cachedTypes={cachedTypes}
							cachedItems={cachedItems}
						/>
						{/* <Moves 
							pokemon={pokemon}
							chainId={chainId}
							speciesInfo={speciesInfo}
							key={pokemon.id}
						/> */}
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

export function RelatedPokemon ({pokemonId, order}) {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const navigateToPokemon = useNavigateToPokemon();

	return (
		<div className={`navigation ${order} `} onClick={() => {navigateToPokemon(state, dispatch, [pokemonId], ['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items'])}}>
			<span>{String(pokemonId).padStart(4, 0)}</span>
			<img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`} alt={pokemonId} />
		</div>
	)
}