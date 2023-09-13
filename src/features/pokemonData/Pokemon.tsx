import React, { useEffect, memo, useMemo } from "react";
import { useParams } from "react-router-dom";
import { selectPokemonById, selectSpeciesById, selectChainDataByChainId, selectAllIdsAndNames, selectPokemonCount, getRequiredDataThunk, selectPokemons } from "./pokemonDataSlice";
import { selectStatus, error } from "../display/displaySlice";
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
import { getIdFromURL } from "../../util";
import { useNavigateNoUpdates } from "../../components/RouterUtils";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

type PokemonParams = {
	pokeId: string
}

export default function Pokemon() {
	const dispatch = useAppDispatch();
	const {pokeId} = useParams<PokemonParams>() as PokemonParams;
	const navigateNoUpdates = useNavigateNoUpdates();
	const status = useAppSelector(selectStatus);
	const namesAndIds = useAppSelector(selectAllIdsAndNames);
	const pokemonCount = useAppSelector(selectPokemonCount);
	const pokemons = useAppSelector(selectPokemons)

	// enable searching pokemon name in url bar in English.
	let urlParam = pokeId;
	if (isNaN(Number(pokeId))) {
		// if we can't find the corresponding id, use what it is.
		// namesAndIds will always have the english names
		const id = namesAndIds[pokeId.toLowerCase()];
		urlParam = id ? String(id) : pokeId;
	};
	const pokemon = useAppSelector(state => selectPokemonById(state, urlParam));
	const speciesData = useAppSelector(state => selectSpeciesById(state, urlParam));
	const chainId = getIdFromURL(speciesData?.evolution_chain?.url);
	const chainData = useAppSelector(state => selectChainDataByChainId(state, chainId));
	const isDataReady = [pokemon, speciesData, chainData].every(Boolean);

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
	const previousPokemonId = nationalNumber === 1 ? pokemonCount! : nationalNumber - 1;

	const rootLink = useMemo(() => <div onClick={() => navigateNoUpdates('/')} className="w-50 m-3 btn btn-block btn-secondary">Explore More Pokemons</div>, [navigateNoUpdates]);
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

type RelatedPokemonProps = {
	pokemonId: number
	order: 'previous' | 'next'
}

const RelatedPokemon = memo<RelatedPokemonProps>(function RelatedPokemon ({pokemonId, order}) {
	return (
		<PrefetchOnNavigation
			requestPokemonIds={[pokemonId]}
			requests={['pokemons', 'pokemonSpecies', 'evolutionChains', 'abilities', 'items']}
			customClass={`navigation ${order} `}
		>
			<span>{String(pokemonId).padStart(4, '0')}</span>
			<img width='475' height='475' src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`} alt={String(pokemonId)} />
		</PrefetchOnNavigation>
	)
});