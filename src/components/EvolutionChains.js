import { usePokemonData } from "./PokemonsProvider"
import { useParams } from "react-router-dom"
import { useEffect } from "react";
import { Link } from "react-router-dom";
import BasicInfo from "./BasicInfo";
import { getIdFromURL } from "../util";

export default function EvolutionChains() {
	const {pokeId} = useParams();
	const {state, dispatch} = usePokemonData();
	const evolutionChainURL = state.pokemon_species[pokeId].evolution_chain.url;
	const chianId = getIdFromURL(evolutionChainURL);
	useEffect(() => {
		const getEvolutionChains = async () => {
			
			if (state?.evolution_chain?.[chianId]) {
				return
			} else {
				dispatch({type: 'dataLoading'});
				const response = await fetch(evolutionChainURL);
				const data = await response.json();
				function getSpeciesId(speciesURL) {
					return String(getIdFromURL(speciesURL))
				}
	
				function mapArr(arr) {
					return arr.map(element => {
						if (element.evolves_to.length > 0) {
							return {
								name: element.species.name,
								id: getSpeciesId(element.species.url),
								evolves_to: mapArr(element.evolves_to)
							}
						} else {
							return {
								name: element.species.name, 
								id: getSpeciesId(element.species.url),
							}
						}
					})
				}
				function flatFunc(arr) {
					let copy = [...arr];
					if (copy.length === 1) {
						copy = copy[0]
					};
					
					if (copy.hasOwnProperty('evolves_to')) {
						copy.evolves_to = flatFunc(copy.evolves_to)
					}
					return copy
				};
				const sortedObj = flatFunc(mapArr(data.chain.evolves_to));
				const evolution_chain = {id: getSpeciesId(data.chain.species.url), name:data.chain.species.name, evolves_to: sortedObj}
				
				dispatch({type: 'evolutionChainLoaded', payload: {
					id: chianId, chain:evolution_chain
				}})
			}
		};
		getEvolutionChains();
	}, [chianId, dispatch, evolutionChainURL, ])
	const evolution_chain = state.evolution_chain[chianId]
	const pathArr = [];
	// if(evolution_chain?.evolves_to instanceof Array) {
	// 	// no evolution
	// 	if (evolution_chain.evolves_to.length === 0){
	// 		// passing id or name
	// 		pathArr.push(evolution_chain.id)
	// 	} 
	// 	// multiple paths
	// 	else if (evolution_chain.hasOwnProperty('evolves_to')) {
	// 		evolution_chain.evolves_to.map(path => pathArr.push([evolution_chain.id, path.id]))
	// 	}
	// 	// single path
	// } else if (evolution_chain?.evolves_to instanceof Object) {
	// 	function getPath(obj, arr) {
	// 		arr.push(obj.id);
	// 		if (obj.hasOwnProperty('evolves_to')) {
	// 			getPath(obj.evolves_to, arr)
	// 		}
	// 	};
	// 	getPath(evolution_chain, pathArr)
	// }

	function sortEvolutionChain(objToCheck, arrayToPush) {
		if (objToCheck?.evolves_to instanceof Array || objToCheck instanceof Array) {
			// no evolution
			if (objToCheck.evolves_to.length === 0) {
				arrayToPush.push(objToCheck.id)
			} else {
				// multiple paths
				// deal with special cases
				if (arrayToPush.length === 1 && typeof arrayToPush[0] === 'string') {
					objToCheck.evolves_to.map(path => arrayToPush.push([arrayToPush[0], objToCheck.id, path.id]));
					arrayToPush.shift();
				} else {
					objToCheck.evolves_to.map(path => arrayToPush.push([objToCheck.id, path.id]))
				}
			};
		} else if (objToCheck?.evolves_to instanceof Object || objToCheck instanceof Object) {
			// single path
			arrayToPush.push(objToCheck.id)
			sortEvolutionChain(objToCheck.evolves_to, arrayToPush)
		};
	};
	sortEvolutionChain(evolution_chain, pathArr)

	let content;
	if (pathArr.length === 1) {
		content = (
			<p className="text-center">This Pokémon does not evolve.</p>
		)
	} else {
		content = (
			<ul className={`evolutionContainer p-0 m-0 mx-auto ${ typeof pathArr[0] === 'string' ? 'd-lg-flex' : 'row justify-content-around'}`}>
				{
					pathArr.map(element => {
						if (element instanceof Array) {
							return (
								<ul key={element} className={`multiplePath p-0 mt-5 ${element.length > 2 ? 'col-6 col-sm-12 specialCase' : 'col-lg-5'}`}>
									{
										element.map(pokemonId => (
											<li key={pokemonId}>
												{/* if no pokemon data, pass id */}
												<Link to={`/pokemons/${pokemonId}`}>
													<BasicInfo pokemon={state.pokemons[pokemonId] || pokemonId}/>
												</Link>
											</li>
										))
									}
								</ul>
							)
						} else if (typeof element === 'string') {
							return (
								<li key={element} className="singlePath">
									<Link to={`/pokemons/${element}`}>
										<BasicInfo pokemon={state.pokemons[element] || element}/>
									</Link>
								</li>
							)
						}
					})
				}
			</ul>
		)
	}

	return (
		<div className="col-12 mt-5 evolutionChain">
			<h1 className="text-center">Evolutions</h1>
			{content}
		</div>
	)
}