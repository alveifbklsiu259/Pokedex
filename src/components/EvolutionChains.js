import React, { memo } from "react";
import BasicInfo from "./BasicInfo";
import EvolutionDetails from "./EvolutionDetails";
import { useNavigateToPokemon } from "../api";
import { useSelector } from "react-redux";
import { selectPokemons } from "../features/pokemonData/pokemonDataSlice";

const EvolutionChains = memo(function EvolutionChains({
	evolutionChains,
	chainId,
}) {
	const pokemons = useSelector(selectPokemons);
	const navigateToPokemon = useNavigateToPokemon();
	// get max depth (for layout)
	let maxDepth = 1;
	evolutionChains.forEach(chain => {
		if (chain.length > maxDepth) {
			maxDepth = chain.length;
		};
	});
	
	let content;
	if (evolutionChains.length === 1 && evolutionChains[0].length === 1) {
		content = (
			<p className="text-center">This Pokémon does not evolve.</p>
		)
	} else if (evolutionChains.length === 1) {
		// single path
		content = (
			<ul className={`p-2 ${maxDepth > 2 ? 'gtTwo' : 'ltThree'}`}>
				{evolutionChains[0].map((pokemonId, index, array) => (
					<React.Fragment key={pokemonId}>
						<li>
							<div style={{cursor: 'pointer'}} onClick={() => {navigateToPokemon([pokemonId], ['pokemonSpecies', 'abilities'])}} >
								<BasicInfo
									pokemon={pokemons[pokemonId]}
								/>
							</div>
						</li>
						{index < array.length - 1 && (
							<li className='caret mt-5 mb-2'>
								<EvolutionDetails
									chainId={chainId}
									pokemonId={array[index + 1]}
								/>
							</li>
						)}
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
												<div style={{cursor: 'pointer'}} onClick={() => {navigateToPokemon([pokemonId], ['pokemonSpecies', 'abilities'])}} >
													<BasicInfo 
														pokemon={pokemons[pokemonId]}
													/>
												</div>
											</li>
											{index < array.length - 1 && (
												<li className="caret">
													<EvolutionDetails 
													chainId={chainId} 
													pokemonId={array[index + 1]}
												/>
												</li>
											)}
										</React.Fragment>
									))
								}
							</ul>
						)
					})
				}
			</ul>
		)
	};

	return (
		<div className="col-12 mt-5 evolutionChains p-0">
			<h1 className="text-center">Evolutions</h1>
			{content}
		</div>
	)
});
export default EvolutionChains;