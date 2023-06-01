import { useDispatchContenxt, usePokemonData } from "./PokemonsProvider"
import { useParams } from "react-router-dom"
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import BasicInfo from "./BasicInfo";
import { getIdFromURL } from "../util";

// cache evolution chain so when we click pokemon in the chain, we don't have to re-render it

export default function EvolutionChains() {
	const {pokeId} = useParams();
	const {state} = usePokemonData();
	const dispatch = useDispatchContenxt();

	const evolutionChainURL = state.pokemon_species[pokeId].evolution_chain.url;
	const chianId = getIdFromURL(evolutionChainURL);
	const evolutionChains = state.evolution_chain[chianId];
	let maxDepth = 1;
	
	useEffect(() => {
		if (!evolutionChains) {
			const getEvolutionChains = async () => {
				dispatch({type: 'dataLoading'});
				const response = await fetch(evolutionChainURL);
				const data = await response.json();

				// get chains
				let chainIds = [];
				let index = 0;
				let depth = 1;
				chainIds[index] = {};
				const getIdsFromChain = chains => {
					// get id 
					chainIds[index][`depth-${depth}`] = getIdFromURL(chains.species.url)
					if (chains.evolves_to.length) {
						depth ++;
						chains.evolves_to.map((chain, index, array) => {
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
					return Object.values(sortedChain)
				});
				
				dispatch({type: 'evolutionChainLoaded', payload: {id: chianId, chains: sortedChains}});
			};
			getEvolutionChains();
		}
	}, [evolutionChains, chianId]);
	
	// console.log(state)
	let content;
	if (evolutionChains !== undefined) {

		// get max depth
		evolutionChains.map(chain => {
			if (chain.length > maxDepth) {
				maxDepth = chain.length;
			};
		});

		if (evolutionChains.length === 1 && evolutionChains[0].length === 1) {
			content = (
				<p className="text-center">This Pokémon does not evolve.</p>
			)
		} else if (evolutionChains.length === 1) {
			// single path
			content = (
				<ul className={`p-2 ${maxDepth > 2 ? 'gtTwo' : 'ltThree'}`}>
					{evolutionChains[0].map((pokemon, index, array) => (
						<React.Fragment key={pokemon}>
							<li>
								<Link to={`/pokemons/${pokemon}`}>
									<BasicInfo pokemon={state.pokemons[pokemon] || pokemon}/>
								</Link>
							</li>
							{index < array.length - 1 ? <li className='caret'></li> : null}
						</React.Fragment>
					))}
				</ul>
			)
		} else {
			// multiple paths
			content = (
				<ul className={`p-0 ${maxDepth > 2 ? 'gtTwoContainer' : 'ltThreeContainer'}`}>
					{
						evolutionChains.map(chain => {
							return (
								<ul key={chain} className={maxDepth > 2 ? 'gtTwo' : 'ltThree'}>
									{
										chain.map((pokemonId, index, array) => (
											<React.Fragment key={pokemonId}>
												<li className="multiplePath">
													{/* if no pokemon data, pass id */}
													<Link to={`/pokemons/${pokemonId}`}>
														<BasicInfo pokemon={state.pokemons[pokemonId] || pokemonId}/>
													</Link>
												</li>
												{index < array.length - 1 ? <li className="caret"></li> : null} 
											</React.Fragment>
										))
									}
								</ul>
							)
						})
					}
				</ul>
			)
		}
	}

	return (
		<div className="col-12 mt-5 evolutionChain p-0">
			<h1 className="text-center">Evolutions</h1>
			{content}
		</div>
	)
}