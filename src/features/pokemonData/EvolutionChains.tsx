import React, { memo } from "react";
import BasicInfo from "./BasicInfo";
import EvolutionDetails from "./EvolutionDetails";
import { useNavigateToPokemon } from "../../api";
import { selectChainDataByChainId, selectGenerations, selectPokemons, selectSpecies } from "./pokemonDataSlice";
import { getIdFromURL } from "../../util";
import { useAppSelector } from "../../app/hooks";
import type { Pokemon } from "../../../typeModule";

type NonDefaultFormPokemonData = Required<Pokemon.Root>

type EvolutionChainsProps = {
	chainId: number
}

const EvolutionChains = memo<EvolutionChainsProps>(function EvolutionChains({chainId}) {
	const navigateToPokemon = useNavigateToPokemon();
	const chainData = useAppSelector(state => selectChainDataByChainId(state, chainId));
	const pokemons = useAppSelector(selectPokemons);
	const species = useAppSelector(selectSpecies);
	const generations = useAppSelector(selectGenerations);
	let evolutionChains = chainData.chains;
	const pokemonsInChain = [...new Set(evolutionChains.flat())];

	// since the API doesn't provide evolution relationship between non-default-form, and there isn't really a specific pattern to check their relationship, here's how I'll implement and reason about their relationship:
	// Note: a pokemon may have multiple evolution chains, a pokemon may have multiple non-battle-forms.
	// Goal: show every possible chain, including non-default-form, and since only non-battle-form can possibly be an option in a chain, we can treat battle-only-form (g-max, mega...) as default-form, we may add a new chain or replace the current chain. (we'll check chain by chain instead of the entire chains)
	// 1. check if all pokemons in the chain have non-battle-form, if false, goes to 2, if true, link the forms that have something in common(same form-name or come from same generation) together. e.g pokemon A's form 1 is coming from the same generation as pokemon B's form 2, then they should be linked together. Then Add a new chain of those linked forms. 
	// 2. check if some pokemons in the chain has non-battle-form, if false, it means all of them only have default-form, then just return the original chain; if ture, check if the pokemons(default) in the the chain are from the same generation, if true, return the original chain (this case happens when a pokemon originally has its evolution chain, then in the newer generation, a new form and new pokemon is added to this pokemon's evolution chain, e.g wooper), if false goes to 3.
	/* 3. the pokemons in this chain are not all from the same generation, and only some of them has non-battle-form, this may indicate:
	- the pokemon that does not have non-battle from is a new pokemon added in a newer generation.
	- the pokemon in the chain that has non-battle-form may appear in the newer generation as the non-battle-form, and evoles to(or from) the said pokemon.
	in this case, we should return a new chain with non-battle-form and the pokemon that does not have non-battle-form.
	*/

	if (pokemonsInChain.length > 1) {
		// nbf stands for non-battle-form.
		const nbfs = pokemonsInChain.reduce<{
			[id: number]: NonDefaultFormPokemonData[]
		}>((pre, cur) => {
			let match: NonDefaultFormPokemonData[] = [];
			species[cur].varieties
				.forEach(variety => {
					const pokemonData = pokemons[getIdFromURL(variety.pokemon.url)];
					if (pokemonData?.formData?.is_battle_only === false) {
						match.push(pokemonData as NonDefaultFormPokemonData);
					};
				});
			pre[cur] = match;
			return pre;
		}, {});

		const nbfTest = (id: number) => !!nbfs[id].length;
		const allHasNbf = (chain: number[]) => chain.every(nbfTest);
		const someHasNbf = (chain: number[]) => chain.some(nbfTest);

		const getGenerationByVersion = (versionName: string) => {
			return Object.values(generations).find(generation => generation.version_groups.some(version => version.name === versionName))!.name;
		};

		// find common data between nbfs and pokemons without nbfs.
		const getCommonData = (chain: number[]) => {
			const pokeIdsWithoutNbf = chain.filter(id => !nbfs[id].length);
			const pokeIdsWithNbf = chain.filter(id => nbfs[id].length);
			const nbfIds = pokeIdsWithNbf.reduce<number[]>((pre, cur) => {
				nbfs[cur].forEach(form => pre.push(form.id));
				return pre;
			}, []);

			const commonData = {
				commonGeneration: '',
				commonName: '',
				idsInCommon: [] as number[]
			};
			
			const generations: string[] = [];
			[...pokeIdsWithoutNbf, ...nbfIds].forEach((id, index, ids) => {
				const versionName = pokemons[id].formData?.version_group?.name;
				const generation = versionName ? getGenerationByVersion(versionName) : species[id].generation.name;
				if (!generations.includes(generation)) {
					generations.push(generation);
				} else {
					commonData.commonGeneration = generation;
					// the previous id
					if (!commonData.idsInCommon.includes(ids[index - 1])) {
						commonData.idsInCommon.push(ids[index - 1]);
					};
					commonData.idsInCommon.push(id);
				};
			});

			// this is not necessary, but if we can get this, it can be used for stricter check.
			if (pokeIdsWithNbf.length >= 2) {
				const formNames: string[] = [];
				nbfIds.forEach(id => {
					const formName = pokemons[id].formData!.form_name;
					if (!formNames.includes(formName)) {
						formNames.push(formName);
					} else {
						commonData.commonName = formName;
					};
				});
			};
			return commonData;
		};

		const isDefaultFormFromSameGeneration = (chain: number[]) => {
			const generation = species[chain[0]].generation.name;
			return chain.every(id => species[id].generation.name === generation);
		};

		const hasChain = (appendChain: number[], chains: number[][]) => {
			let exist = false;
			chains.forEach(chain => {
				if (JSON.stringify(chain) === JSON.stringify(appendChain)) {
					exist = true;
				};
			});
			return exist;
		};
		evolutionChains = evolutionChains.reduce<number[][]>((newChains, currentChain) => {
			const {commonName, commonGeneration, idsInCommon} = getCommonData(currentChain);
			const commonTest = (form: NonDefaultFormPokemonData) => {
				const isFormMatch = form.formData.form_name === commonName;
				const isGenerationMatch = getGenerationByVersion(form.formData.version_group.name) === commonGeneration;
				return commonName ? (isFormMatch && isGenerationMatch) : (isFormMatch || isGenerationMatch);
			};

			const getMatchIds = (chain: number[]) => {
				return chain.map(id => {
					if (nbfs[id].length && commonGeneration) {
						return nbfs[id].find(commonTest)?.id || id;
					} else {
						return id;
					};
				});
			};
			
			if (allHasNbf(currentChain)) {
				const newChain = getMatchIds(currentChain);
				newChains.push(currentChain);
				if (!hasChain(newChain, newChains)) {
					newChains.push(newChain);
				};
			} else if(someHasNbf(currentChain)) {
				const newChain = getMatchIds(currentChain);
				
				if (isDefaultFormFromSameGeneration(currentChain)) {
					newChains.push(currentChain);
				} else {
					let modifiedChain: number[];
					if (currentChain.length > 2) {
						modifiedChain = currentChain.reduce<number[]>((pre, cur) => {
							pre.push(cur);
							nbfs[cur].forEach(form => pre.push(form.id));
							return pre;
						}, []);

						// reshape the original chain, in some cases, the chain contains pokemon that does not evolve from the original default form.
						idsInCommon.forEach(id => {
							modifiedChain.splice(modifiedChain.indexOf(id), 1);
						});

						if (!hasChain(modifiedChain, newChains)) {
							newChains.push(modifiedChain);
						};
					};
				};
				if (!hasChain(newChain, newChains)) {
					// There's some inconsistent data in the API, for example Totem pokemon should be is_battle_only: true, but 10150(a Totem form) it's is_battle_only is false.
					const edgeCaseIds = [10094, 10150];
					// this condition is for filtering out some edge cases.
					if (!newChain.some(id => edgeCaseIds.includes(id))) {
						newChains.push(newChain);
					};
				};
			} else {
				newChains.push(currentChain);
			};
			return newChains;
		}, []);
	};

	// some edge cases
	if (pokemonsInChain.includes(744)) {
		evolutionChains = [[744, 745], [744, 10126], [744, 10152]];
	};

	const getDefaultFormId = (nonDefaultFormId: number) => {
		return getIdFromURL(pokemons[nonDefaultFormId].species.url);
	};

	const getIsChainDefault = (chain: number[]) => {
		return !chain.some(id => pokemons[id].is_default === false);
	};

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
							<div className="chainInfoContainer" onClick={() => {navigateToPokemon([pokemonId], ['pokemonSpecies', 'ability'])}} >
								<BasicInfo pokeId={String(pokemonId)} />
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
							<ul key={JSON.stringify(chain)} className={maxDepth > 2 ? 'gtTwo' : 'ltThree'}>
								{
									chain.map((pokemonId, index, array) => (
										<React.Fragment key={pokemonId}>
											<li className="multiplePath">
												<div className="chainInfoContainer" onClick={() => {navigateToPokemon([pokemonId], ['pokemonSpecies', 'ability'])}} >
													<BasicInfo pokeId={String(pokemonId)} />
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

	// to do:
	// check async await forEach
	// make a to do list for yourself (trak todo/bugs...)
	// handle chaing language in Error page