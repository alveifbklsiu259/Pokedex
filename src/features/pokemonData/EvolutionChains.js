import React, { memo, useCallback, version } from "react";
import { useSelector } from "react-redux";
import BasicInfo from "./BasicInfo";
import EvolutionDetails from "./EvolutionDetails";
import { useNavigateToPokemon } from "../../api";
import { selectChainDataByChainId, selectGenerations, selectPokemons, selectSpecies } from "./pokemonDataSlice";
import { getIdFromURL, transformToDash, transformToKeyName } from "../../util";

const EvolutionChains = memo(function EvolutionChains({chainId, nonDefaultPokemonData, nonBattlePokemonData, pokeId}) {
	const navigateToPokemon = useNavigateToPokemon();
	const chainData = useSelector(state => selectChainDataByChainId(state, chainId));
	const pokemons = useSelector(selectPokemons);
	const species = useSelector(selectSpecies);
	const generations = useSelector(selectGenerations);
	let evolutionChains = chainData.chains;
	const pokemonsInChain = [...new Set(evolutionChains.flat())];

	// the logic can be a bit more simpler, 

	// in the chain, if there's pokemon comes from different generation/version than other
	// check if the other pokemon has different form (not the form tha's battle only) that comes from the same generation/version, if it has, it probably means  we should use those form in the chain


	// check if displaying non-default-form

	// the code below may look messy, since the API doesn't provide evolution relationship between non-default-form, and there isn't really a specific pattern to check their relationship.
	if (pokemonsInChain.length > 1) {
		

		// const hasPokemonFronDifferentVersion = chain => 
		// find the version that appears most often, or
		// find the version that 

		// pokemons in the cahin will definitely be default-form pokemon originally, 
		// case 1 if in a chain, all pokemon has non-battle form that comes from the specific version, we can pretty much say that it's a variation of the current chain, so we can just change the chain when we're at those form or just add an extra chain to the chains.
		// case 2: if in a chain, there're pokemons from different version, check if pokemons in chain have non-battle-form, for example in [1, 2, 3] meets the above requirements, and 1,2 have non-battle form, when we're at 1 and 2's non-battle-form, the cahin should be those form + 3 and while at 1 or 2, we should excluded 3 from the chain (or simply show an extra chain that has [1's non-battle, 2's non-battle], 3);

		const nonBattleForms = pokemonsInChain.reduce((pre, cur) => {
			let match = [];
			species[cur].varieties
				.forEach(variety => {
					if (pokemons[getIdFromURL(variety.pokemon.url)]?.formData?.is_battle_only === false) {
						match.push(pokemons[getIdFromURL(variety.pokemon.url)]);
					};
				});
			pre[cur] = match;
			return pre;
		}, {});

		const allHasNonBattleFormInChain = chain => chain.every(id => nonBattleForms[id].length);
		const someHasNonBattleFormInChain = chain => chain.some(id => nonBattleForms[id].length);

		const formName = nonBattlePokemonData?.formData?.form_name;
		const formVersion = nonBattlePokemonData?.formData?.version_group?.name;
		const test = form => form.formData.form_name === formName && form.formData.version_group.name === formVersion;
		const hasSpecificFormInChain = chain => chain.every(id => nonBattleForms[id].some(test));

		const isFromSameGeneration = chain => {
			const generation = species[chain[0]].generation.name;
			return chain.every(id => species[id].generation.name === generation);
		};

		const getGenerationByVersion = versionName => {
			return Object.values(generations).find(generation => generation.version_groups.some(version => version.name === versionName)).name;
		};

		// const getCommonData = (idsWithNonBattleForm, idsWithoutNonBattleForm, nonBattleFormIds) => {
		// 	const commonData = {
		// 		commonName: '',
		// 		commonGeneration: ''
		// 	};
		// 	let common;
		// 	if (idsWithNonBattleForm.length >= 2) {
		// 		// find common name
		// 		idsWithNonBattleForm.forEach(id => {
		// 			const formName = pokemons[id].formData.form_name;
		// 			if (common !== formName) {
		// 				common = formName;
		// 			} else {
		// 				commonData.commonName = formName
		// 			};
		// 		});
		// 	} else {
		// 		// find common generation
		// 		[...idsWithoutNonBattleForm, ...nonBattleFormIds].forEach(id => {
		// 			if (!pokemons[id].formData) {
		// 				const generation = species[id].generation.name;
		// 				if (common !== generation) {
		// 					common = generation
		// 				} else {
		// 					commonData.commonGeneration = generation
		// 				}
		// 			} else {
		// 				console.log(common)
		// 				const versionName = pokemons[id].formData.version_group.name;
		// 				const generation = getGenerationByVersion(versionName);

		// 				if (common !== generation) {
							
		// 					common = generation;
		// 				} else {
		// 					commonData.commonGeneration = generation
		// 				}

		// 			};
		// 		});
		// 	};
		// 	console.log(commonData)
		// 	return commonData;
		// };

		const getCommonData = (idsWithNonBattleForm, idsWithoutNonBattleForm, nonBattleFormIds) => {
			const commonData = {
				name: '',
				generation: ''
			};
			if (idsWithNonBattleForm.length >= 2) {
				// find common name
				const formNames = [];
				console.log(idsWithNonBattleForm)

				idsWithNonBattleForm.forEach(id => {
					nonBattleForms[id].forEach(form => {
						const formName = pokemons[form.id].formData.form_name;
						if (!formNames.includes(formName)) {
							formNames.push(formName);
						} else {
							commonData.name = formName;
						};
					});
				});
			} else {
				// find common generation
				const gens = [];
				[...idsWithoutNonBattleForm, ...nonBattleFormIds].forEach(id => {
					let generation;
					const versionName = pokemons[id]?.formData?.version_group?.name;
					if (versionName) {
						generation = getGenerationByVersion(versionName);
					} else {
						generation = species[id].generation.name;
					};
					if (!gens.includes(generation)) {
						gens.push(generation);
					} else {
						commonData.generation = generation;
					};
				});
			};
			console.log(commonData)
			return commonData;
		};


		const isViewingNonBattleForm = Object.values(nonBattleForms).some(forms => forms.some(form => form.id === Number(pokeId)));

	

		// the one that does not have non-battle-form is viewed, show [nbf, nbf, pokemon], or add an extra chain
		// what we want to know:
		// isFromDifferentChain
		// which one has nbf


		// evolutionChains = evolutionChains.reduce((newChains, currentChain) => {
		// 	if (isViewingNonBattleForm) {
		// 		if (allHasNonBattleFormInChain(currentChain) && hasSpecificFormInChain(currentChain)) {
		// 			if (nonBattlePokemonData) {
		// 				// if we're viewing non-battle form
		// 				const newChain = currentChain.map(id => nonBattleForms[id].find(test).id);
		// 				newChains.push(newChain);
		// 			} else {
		// 				// // if viewing default form or battle-only form
		// 				// newChains.push(currentChain);
		// 			};
		// 			return newChains;
		// 		// case 2
		// 		// if in the current chain, there's pokemon from different generation.
		// 		} else if (!isFromSameGeneration(currentChain)) {
		// 			if (someHasNonBattleFormInChain(currentChain)) {
		// 				const idsWithoutNonBattleForm = currentChain.filter(id => !nonBattleForms[id].length);
		// 				const idsWithNonBattleForm = currentChain.filter(id => !idsWithoutNonBattleForm.includes(id));
						
		// 				const nonBattleFormIds = idsWithNonBattleForm.reduce((pre, cur) => {
		// 					console.log(nonBattleForms[cur])
		// 					nonBattleForms[cur].forEach(form => pre.push(form.id));
		// 					return pre;
		// 				}, [])
	
		// 				// if viewing non-battle-form or pokemon without non-battle-form.
		// 				if (nonBattlePokemonData || idsWithoutNonBattleForm.includes(pokeId)) {
		// 					const commonData = getCommonData(idsWithNonBattleForm, idsWithoutNonBattleForm, nonBattleFormIds);
		// 					if (commonData.commonName) {
		// 						// find common info
		// 						const newChain = currentChain.map(id => {
		// 							if (nonBattleForms[id].length) {
		// 								return nonBattleForms[id].find(form => form.formData.form.formName === commonData.commonName)?.id || id;
		// 							} else {
		// 								return id;
		// 							};
		// 						});
		// 						newChains.push(newChain);
		// 					} else if (commonData.commonGeneration) {
		// 						const newChain = currentChain.map(id => {
		// 							if (nonBattleForms[id].length) {
		// 								return nonBattleForms[id].find(form => getGenerationByVersion(form.formData.version_group.name) === formVersion)?.id || id;
		// 							} else {
		// 								return id;
		// 							};
		// 						});
		// 						newChains.push(newChain);
		// 					} else {
		// 						// if no commonData
		// 						console.log('no common data, should do the above?')
		// 						newChains.push(currentChain);
		// 					};
		// 				// if viewing default form or battle-only form
		// 				} else {
		// 					console.log(55)
		// 					// we don't want the pokemon that doesn't have non-battle-form shown in the chain
		// 					// show the original chain without pokemon without nbf
		// 					const newChain = [...currentChain];
	
		// 					idsWithNonBattleForm.forEach(id => {
		// 						newChain.splice(currentChain.indexOf(id), 1);
		// 					});
		// 					if (newChain.length > 1) {
		// 						newChains.push(currentChain)
		// 					};
		// 				};
		// 			} else {
		// 				// none of the pokemon in this chain has non-battle-form, we can just use the original chain.
		// 				newChains.push(currentChain);
		// 			};
		// 			return newChains;
		// 		} else {
		// 			// if viewing default form or battle-only form
		// 			console.log('viewing default pokemon')
		// 			newChains.push(currentChain);
		// 			return newChains;
		// 		}




		// 	} else {
		// 		// viewing default-form or battle-form
		// 	}

		// }, []);
		evolutionChains = evolutionChains.reduce((newChains, currentChain) => {
			const idsWithoutNonBattleForm = currentChain.filter(id => !nonBattleForms[id].length);
			const idsWithNonBattleForm = currentChain.filter(id => !idsWithoutNonBattleForm.includes(id));
			const nonBattleFormIds = idsWithNonBattleForm.reduce((pre, cur) => {
				nonBattleForms[cur].forEach(form => pre.push(form.id));
				return pre;
			}, []);

			if (isViewingNonBattleForm) {
				if (allHasNonBattleFormInChain(currentChain)) {
					if (hasSpecificFormInChain(currentChain)) {
						const newChain = currentChain.map(id => nonBattleForms[id].find(test).id);
						newChains.push(newChain);
					} else {
						// the non-battle-form being viewed now has nothing with the current chain.
						newChains.push(currentChain);

						console.log('unsolved 1')
					};
					return newChains;
				} else if (!isFromSameGeneration(currentChain) && someHasNonBattleFormInChain(currentChain)) {
					// if in the current chain, there's pokemon from different generation && some of them have non-battle-form.
					const commonData = getCommonData(idsWithNonBattleForm, idsWithoutNonBattleForm, nonBattleFormIds);
					if (commonData.name) {
						const newChain = currentChain.map(id => {
							if (nonBattleForms[id].length) {
								return nonBattleForms[id].find(form => form.formData.form_name === commonData.name).id;
							} else {
								return id;
							};
						});
						newChains.push(newChain);
					} else if (commonData.generation) {
						const newChain = currentChain.map(id => {
							if (nonBattleForms[id].length) {
								return nonBattleForms[id].find(form => getGenerationByVersion(form.formData.version_group.name) === commonData.generation).id;
							} else {
								return id;
							};
						});
						newChains.push(newChain);
					} else {
						// if no commonData
						console.log('unsolved 2, no common data')
						newChains.push(currentChain);
					};
						// // show the original chain without pokemon without nbf
						// const newChain = [...currentChain];

						// idsWithNonBattleForm.forEach(id => {
						// 	newChain.splice(currentChain.indexOf(id), 1);
						// });
						// if (newChain.length > 1) {
						// 	newChains.push(currentChain)
						// };
						// // };
					return newChains;
				} else {
					// viewing non-battle-form && all from the same generation && not all have non-battle-form.
					console.log('viewing default pokemon')
					if (isFromSameGeneration(pokemonsInChain)) {
						const newChain = currentChain.map(id => {
							if (nonBattleForms[id].length) {
								return nonBattleForms[id].find(form => form.formData.version_group.name === formVersion).id;
							} else {
								return id;
							};
						})
						newChains.push(newChain);
						console.log(99)
					} else {
						newChains.push(currentChain);
						console.log(123)
					};
					return newChains;
				};
			} else {
				// viewing default-form or battle-only-form
				console.log(currentChain);
				if (isFromSameGeneration(currentChain)) {
					
					
					// more logic to be added here...
					
					newChains.push(currentChain);
				} else {
					const commonData = getCommonData(idsWithNonBattleForm, idsWithoutNonBattleForm, nonBattleFormIds);
					console.log(commonData)
					// if (commonData.name) {
					// 	const newChain = currentChain.map(id => {
					// 		if (nonBattleForms[id].length) {
					// 			return nonBattleForms[id].find(form => form.formData.form.formName === commonData.name).id;
					// 		} else {
					// 			return id;
					// 		};
					// 	});
					// 	newChains.push(newChain);
					// } else if (commonData.generation) {
					// 	const newChain = currentChain.map(id => {
					// 		if (nonBattleForms[id].length) {
					// 			return nonBattleForms[id].find(form => getGenerationByVersion(form.formData.version_group.name) === commonData.generation).id;
					// 		} else {
					// 			return id;
					// 		};
					// 	});
					// if there's a coresponding non-battle-form to one of the pokemon, remove that pokemon, else if none of them has non-battle-form, show original chain
				}


				// if error occurs, return the original evolutionChains


				return newChains;
			};
		}, []);


		
	};

	const getDefaultFormId = nonDefaultFormId => {
		return getIdFromURL(pokemons[nonDefaultFormId].species.url);
	};

	const getIsChainDefault = chain => {
		return !chain.some(id => pokemons[id].is_default === false);
	}
	// to do:
	// check Rattata, Dunsparce
	// check async await forEach
	//add evolutionchain feature
	// make a to do list for yourself (trak todo/bugs...)
	// the relatedPokemon, should I show the next number or the next pokemon in intersection?


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
								<BasicInfo pokeId={pokemonId} />
							</div>
						</li>
						{index < array.length - 1 && (
							<li className='caret mt-5 mb-2'>
								<EvolutionDetails
									chainId={chainId}
									defaultFormId={getDefaultFormId(array[index + 1])}
									isChainDefault={getIsChainDefault(array)}
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
													<BasicInfo pokeId={pokemonId} />
												</div>
											</li>
											{index < array.length - 1 && (
												<li className="caret">
													<EvolutionDetails 
														chainId={chainId} 
														defaultFormId={getDefaultFormId(array[index + 1])}
														isChainDefault={getIsChainDefault(array)}
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