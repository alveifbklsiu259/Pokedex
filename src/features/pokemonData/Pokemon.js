import React, { useEffect, memo, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectPokemonById, selectSpeciesById, selectChainDataByChainId, selectAllIdsAndNames, selectAbilities, selectItems, selectPokemonCount, getRequiredDataThunk } from "./pokemonDataSlice";
import { selectLanguage, selectStatus, error } from "../display/displaySlice";
import BasicInfo from "./BasicInfo";
import Detail from "./Detail";
import Stats from "./Stats";
import EvolutionChains from "./EvolutionChains";
import Spinner from "../../components/Spinner";
import ScrollToTop from "../../components/ScrollToTop";
import Moves from "./Moves";
import ErrorPage from "../../components/ErrorPage";
import Varieties from "./Varieties";
import PrefetchOnNavigation from "../../components/PrefetchOnNavigation";
import { getAbilitiesToDisplay, getItemsFromChain } from "../../api";
import { getIdFromURL, transformToKeyName } from "../../util";
import { useNavigateNoUpdates } from "../../components/RouterUtils";

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
						<EvolutionChains chainId={chainId} 
							nonDefaultPokemonData={pokemon.is_default ? null : pokemon}
							nonBattlePokemonData={pokemon?.formData?.is_battle_only === false ? pokemon : null}
							pokeId={pokeId}
						/>
						<Moves
							pokeId={urlParam}
							chainId={chainId}
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
	return (
		<PrefetchOnNavigation
			requestPokemonIds={[pokemonId]}
			requests={['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items']}
			customClass={`navigation ${order} `}
		>
			<span>{String(pokemonId).padStart(4, 0)}</span>
			<img width='475' height='475' src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`} alt={pokemonId} />
		</PrefetchOnNavigation>
	)
});