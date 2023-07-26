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
import { useNavigateToPokemon } from "./PokemonsProvider";
import { getAbilitiesToDisplay, getItemsFromChain } from "../api";
import { getIdFromURL, transformToKeyName } from "../util";
import { useSelector, useDispatch } from "react-redux";
import { selectPokemons, selectSpecies, selectLanguage, selectStatus, selectAllIdsAndNames, selectEvolutionChains, selectAbilities, selectItems, selectPokemonCount, error, getRequiredDataThunk } from "../features/pokemonData/pokemonDataSlice";

export default function Pokemon() {

	// we can have a select single pokemon selector here, but I don't think we need to, because when state.pokemons changes, it's when we navigate to otehr route, so whether reading all pokemons or a single pokemon it's the same(one re-render).
	const pokemons = useSelector(selectPokemons);
	const species = useSelector(selectSpecies);
	const language = useSelector(selectLanguage);
	const status = useSelector(selectStatus);
	const namesAndIds = useSelector(selectAllIdsAndNames);
	const evolutionChains = useSelector(selectEvolutionChains);
	const abilities = useSelector(selectAbilities);
	const items = useSelector(selectItems);
	const pokemonCount = useSelector(selectPokemonCount,);
	const dispatch = useDispatch();
	const {pokeId} = useParams();

	// enable search pokemon by names in url (english)
	let urlParam = pokeId;
	if (isNaN(Number(pokeId))) {
		// if we can't find the corresponding id, use what it is, router will handle error.
		urlParam = namesAndIds[pokeId.toLowerCase()] || pokeId;
	};

	// the reason why searching in other languages doesn't work is because even if we change lange, the get the latest data in allPokemonNamesAndIds, when we enter what we type in the url bar, the whole state gets reset, and we're back to English name id pairs. maybe the workaround would be in the PokemonProviders, if language !== 'en', we have to change name id pairs there.

	// required data for current page
	const pokemon = pokemons[urlParam];
	const speciesInfo = species[getIdFromURL(pokemon?.species?.url)];
	const chainId = getIdFromURL(speciesInfo?.evolution_chain?.url);
	const chainData = evolutionChains?.[chainId];
	const requiredItems = getItemsFromChain(chainData);
	let abilitiesToDisplay, isAbilitiesReady, isItemsReady;
	if (language !== 'en') {
		abilitiesToDisplay = getAbilitiesToDisplay(pokemon);
		isAbilitiesReady = abilitiesToDisplay ? abilitiesToDisplay.every(ability => abilities[ability]) : false;
		isItemsReady = requiredItems ? requiredItems.every(item => items[transformToKeyName(item)]) : false;
	};


	const defaultRequiredData = [pokemon, speciesInfo, chainData];
	const isDataReady = language === 'en' ? defaultRequiredData.every(Boolean) : (defaultRequiredData.every(Boolean) && isAbilitiesReady && isItemsReady);
	useEffect(() => {
		// PokemonProvider also fetches data when it mounts, to avoid race condition, only fetch data when PokemonProvider's request is done. (since the dispatches in PokemonProvider are batched intentionally, status will only become "idle" when all requests in it are done.)
		// To reduce unnecessary re-renders of this component, I think it would be great if we could find a way to batch dispatched between this Effect and the Effect from PokemonProvider, but since the re-renders are mainly caused by Context API, and I decided to migrate to Redux later, I'll just leave it as it is.
		if (!isDataReady && status === 'idle') {
			const getIndividualPokemonData = async () => {
				try {
					await dispatch(getRequiredDataThunk({
						requestPokemonIds: [urlParam],
						requests: ['pokemons', 'pokemonSpecies', 'evolutionChains']
					})).unwrap();
				} catch(err) {
					console.log(err)
					dispatch(error());
				};
			}
			getIndividualPokemonData();
		};
	}, [dispatch, isDataReady, urlParam, status]);

	// on Pokemons, sort by names, change language should re-sort the order.
	const nationalNumber = getIdFromURL(pokemons[urlParam]?.species?.url);
	const nextPokemonId = nationalNumber === pokemonCount ? 1 : nationalNumber + 1;
	const previousPokemonId = nationalNumber === 1 ? pokemonCount : nationalNumber - 1;

	let content;
	if (status === 'idle' && isDataReady) {
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
							/>
						</div>
						<Detail
							pokemon={pokemon}
							speciesInfo={speciesInfo}
						/>
						<Stats
							pokemon={pokemon}
						/>
						<EvolutionChains
							evolutionChains={chainData.chains}
							chainId={chainId}
						/>
						<Moves 
							pokemon={pokemon}
							chainId={chainId}
							speciesInfo={speciesInfo}
							key={pokemon.id}
						/>
						<div className="row justify-content-center">
							<Link to='/' className="w-50 m-3 btn btn-block btn-secondary">Explore More Pokemons</Link>
						</div>
					</div>
				</div>
				<ScrollToTop />
			</>
		)
	} else if (status === 'loading') {
		content = (
			<div style={{position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
				<Spinner />
			</div>
		)
	} else if (status === 'error') {
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
	const navigateToPokemon = useNavigateToPokemon();

	return (
		<div className={`navigation ${order} `} onClick={() => {navigateToPokemon([pokemonId], ['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items'])}}>
			<span>{String(pokemonId).padStart(4, 0)}</span>
			<img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`} alt={pokemonId} />
		</div>
	)
}