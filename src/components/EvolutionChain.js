import { usePokemonData } from "./PokemonsProvider"
import { useParams } from "react-router-dom"
import { useEffect } from "react";

export default function EvolutionChain() {
	const {pokeId} = useParams();
	const {state, dispatch} = usePokemonData();
	const evolutionChainURL = state.pokemon_species[pokeId].evolution_chain.url;
	useEffect(() => {
		const getEvolutionChain = async () => {
			dispatch({type: 'dataLoading'});
			const response = await fetch(evolutionChainURL);
			const data = await response.json();

			function mapArr(arr) {
				return arr.map(element => {
					if (element.evolves_to.length > 0) {
						return {
							name: element.species.name, 
							evolves_to: mapArr(element.evolves_to)
						}
					} else {
						return {
							name: element.species.name, 
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
			const evolution_chain = {name:data.chain.species.name, evolves_to: sortedObj}
			const chianId = evolutionChainURL.slice(evolutionChainURL.indexOf('/', 40) + 1,
			evolutionChainURL.length - 1);
			dispatch({type: 'evolutionChainLoaded', payload: {
				id: chianId, chain:evolution_chain
			}})
		};
		getEvolutionChain();
	}, [])
	console.log(state.evolution_chain)
	console.log(state.pokemons)

    return (
        <div className="col-12 mt-5">
            <h1 className="text-center">Evolutions</h1>
            <ul className="p-0 m-0 mx-auto">
                <li>
                {/* <BasicInfo testId={1} /> */}
                </li>
                <li>
                {/* <BasicInfo testId={2} /> */}
                </li>
                <li>
                {/* <BasicInfo testId={3} /> */}
                </li>
            </ul>
        </div>
    )
}