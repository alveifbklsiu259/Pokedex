import { useEffect, memo, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectPokemonById, selectSpeciesById, selectChainDataByChainId, selectLanguage, selectStatus, selectAllIdsAndNames, selectAbilities, selectItems, selectPokemonCount, error, getRequiredDataThunk } from "../features/pokemonData/pokemonDataSlice";
import BasicInfo from "./BasicInfo";
import Detail from "./Detail";
import Stats from "./Stats";
import EvolutionChains from "./EvolutionChains";
import Spinner from "./Spinner";
import ScrollToTop from "./ScrollToTop";
import Moves from "./Moves";
import ErrorPage from "./ErrorPage";
import Varieties from "./Varieties";
import { getAbilitiesToDisplay, getItemsFromChain, useNavigateToPokemon, usePrefetch } from "../api";
import { getIdFromURL, transformToKeyName } from "../util";
import { useNavigateNoUpdates } from "./RouterUtils";

export default function Pokemon() {
	const dispatch = useDispatch();
	const {pokeId} = useParams();
	const navigateNoUpdates = useNavigateNoUpdates();
	const language = useSelector(selectLanguage);
	const status = useSelector(selectStatus);
	const namesAndIds = useSelector(selectAllIdsAndNames);
	const abilities = useSelector(selectAbilities);
	const items = useSelector(selectItems);
	const pokemonCount = useSelector(selectPokemonCount);

	// enable searching pokemon name in url bar in English.
	let urlParam = pokeId;
	if (isNaN(Number(pokeId))) {
		// if we can't find the corresponding id, use what it is.
		urlParam = namesAndIds[pokeId.toLowerCase()] || pokeId;
	};
	const pokemon = useSelector(state => selectPokemonById(state, urlParam));
	const speciesData = useSelector(state => selectSpeciesById(state, urlParam));
	const chainId = getIdFromURL(speciesData?.evolution_chain?.url);
	const chainData = useSelector(state => selectChainDataByChainId(state, chainId));

	const requiredItems = getItemsFromChain(chainData);
	let abilitiesToDisplay, isAbilitiesReady, isItemsReady;
	if (language !== 'en') {
		abilitiesToDisplay = getAbilitiesToDisplay(pokemon);
		isAbilitiesReady = abilitiesToDisplay?.length ? abilitiesToDisplay.every(ability => abilities[ability]) : true;
		isItemsReady = requiredItems?.length ? requiredItems.every(item => items[transformToKeyName(item)]) : true;
	};

	const defaultRequiredData = [pokemon, speciesData, chainData];
	const isDataReady = language === 'en' ? defaultRequiredData.every(Boolean) : (defaultRequiredData.every(Boolean) && isAbilitiesReady && isItemsReady);
	useEffect(() => {
		if (!isDataReady && status === 'idle') {
			const getIndividualPokemonData = async () => {
				try {
					await dispatch(getRequiredDataThunk({
						requestPokemonIds: [urlParam],
						requests: ['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items']
					})).unwrap();
				} catch(err) {
					console.log(err)
					dispatch(error());
				};
			}
			getIndividualPokemonData();
		};
	}, [dispatch, isDataReady, urlParam, status]);

	const nationalNumber = getIdFromURL(pokemon?.species?.url);
	const nextPokemonId = nationalNumber === pokemonCount ? 1 : nationalNumber + 1;
	const previousPokemonId = nationalNumber === 1 ? pokemonCount : nationalNumber - 1;

	const rootLink = useMemo(() => <div onClick={() => navigateNoUpdates('/')} className="w-50 m-3 btn btn-block btn-secondary">Explore More Pokemons</div>, []);
	let content;
	if (status === 'idle' && isDataReady) {
		content = (
			<>
				<RelatedPokemon pokemonId={previousPokemonId} order='previous'/>
				<RelatedPokemon pokemonId={nextPokemonId} order='next'/>
				<div className={`container p-0 ${speciesData.varieties.length > 1 ? "marginWithVarieties" : 'marginWithoutVarieties'} `}>
					<div className="row justify-content-center">
						{speciesData.varieties.length > 1 && (
							<Varieties pokeId={urlParam} />
						)}
						<div className='basicInfoContainer row col-8 col-sm-6 justify-content-center'>
							<BasicInfo pokeId={urlParam} />
						</div>
						<Detail pokeId={urlParam} />
						<Stats pokeId={urlParam} />
						<EvolutionChains chainId={chainId} />
						<Moves
							pokeId={urlParam}
							chainId={chainId}
							// is it necessary?
							key={pokemon.id}
						/>
						<div className="row justify-content-center">
							{rootLink}
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

const RelatedPokemon = memo(function RelatedPokemon ({pokemonId, order}) {
	const navigateToPokemon = useNavigateToPokemon();
	const [prefetchedData, prefetch] = usePrefetch();

	const handleMouseEnter = () => {
		console.log(prefetchedData.current)
		 // now it works, but mouse enter is not working properly, and alos if you hover then immediately click, you should check if the prefetchedData is resolved, if not, then when the user click, you should show spinner and wait for the request to resolve instead of sending a new request.
		 // maybe we should make a component that use this hook, and whenever we want to prefetch (usually a pokemon image that can be clicked), we can use that component(we can call it prefetchLink or somethign.)
		if (prefetchedData.current === null) {
			prefetch([pokemonId], ['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items']);
		};

	};
	// when we click, we need to reset prefetchedData
	// the prefetchedData will be the same even re-renders. unless the component unmounts.

	const handleClick = async() => {
		// console.log(prefetchedData)
		if (prefetchedData.current) {
			const data = await prefetchedData.current;
			// console.log(data)
			// we can dispatch getRequiredData.fulfilled + navigate to the pokemon 
			// or we can let navigateToPokemon to take an optional fourth argument which is a promose, if the promise is passed down, then we don't have to make request in the thunk.
			navigateToPokemon([pokemonId], ['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items'], undefined, data);
			prefetchedData.current = null;
		}
	}

	return (
		<div 
			className={`navigation ${order} `} 
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
		>
			<span>{String(pokemonId).padStart(4, 0)}</span>
			<img width='475' height='475' src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`} alt={pokemonId} />
		</div>
	)
});

// try prefetch when hover or come into sight


// a variabel 