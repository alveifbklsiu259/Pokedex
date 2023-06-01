import { useEffect, Profiler, useLayoutEffect } from "react";
import { Link, useParams } from "react-router-dom";
import BasicInfo from "./BasicInfo";
import Detail from "./Detail";
import Stats from "./Stats";
import EvolutionChains from "./EvolutionChains";
import { usePokemonData, useDispatchContenxt } from "./PokemonsProvider";
import Spinner from "./Spinner";
import { getIndividualtData } from "../api";

export default function Pokemon() {
	const onRender = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
		// console.log(phase)
	}
	const {state} = usePokemonData();
	const dispatch = useDispatchContenxt();
	const {pokeId} = useParams();
	const pokemon = state.pokemons[pokeId];
	const speciesInfo = state.pokemon_species[pokeId];

	console.log(111, state)
	// mount --> fetch data --> idle
	useEffect(() => {
		if (!pokemon || !speciesInfo) {
			const getIndividualPokemonData = async () => {
				dispatch({type: 'dataLoading'});
				let pokemonData, speciesData;
				if (!pokemon) {
					pokemonData = await getIndividualtData('pokemon', pokeId);
				};
				if (!speciesInfo) {
					speciesData = await getIndividualtData('pokemon-species', pokeId);
				};
				// to batch dispatches
				if (pokemonData) {
					dispatch({type: 'individualPokemonLoaded', payload: pokemonData});
				}
				if (speciesData) {
					dispatch({type: 'pokemonSpeciesLoaded', payload: speciesData});
				}
			};
			getIndividualPokemonData();
		};
	}, [pokemon, speciesInfo, dispatch, pokeId]);

	// cleanup function



	let content;
	if (state.status === 'idle' && pokemon && speciesInfo) {
		content = (
			<div className="container p-0">
				<div className="row justify-content-center">
					<div className='basic-info row col-12 col-sm-6 justify-content-center'>
						<BasicInfo pokemon={pokemon}/>
					</div>
					<Detail pokemon={pokemon} speciesInfo={speciesInfo} />
					<Stats pokemon={pokemon}/>
					{/* <EvolutionChains/> */}
					<div className="row justify-content-center">
						<Link to='/' className="w-50 m-3 btn btn-block btn-secondary">Explore More Pokemons</Link>
					</div>
				</div>

			</div>
		)
	} else {
		content = <Spinner />
	};

	return (
		<Profiler id="pokemon" onRender={onRender}>
			{content}
		</Profiler>
	)
}