import React, { useState, useEffect, useMemo } from "react";
import { capitalize } from "@mui/material";
import { usePokemonData, useDispatchContenxt } from "./PokemonsProvider";
import { transformToKeyName, getIdFromURL, getNameByLanguage } from "../util";
import MovesTable from "./MovesTable";

export default function Moves({speciesInfo, pokemon, chainId}) {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const generations = Object.values(state.generations);
	let pokemonData = pokemon;
	let debutGeneration = speciesInfo.generation.name;
	if (!pokemon.is_default) {
		if (!pokemon.formData?.is_battle_only) {
			debutGeneration = generations.find(generation => generation.version_groups.some(version => version.name === pokemon.formData.version_group.name)).name;
		} else {
			// should use the default form's data, the data was already cached when dealing with evolution chain.
			pokemonData = state.pokemons[getIdFromURL(pokemon.species.url)];
		};
	};
	
	const generationNames = generations.map(generation => generation.name);
	const generationOptions = generationNames.slice(generationNames.indexOf(debutGeneration));
	const [selectedGeneration, setSelectedGeneration] = useState(debutGeneration);

	const versions = state.generations[transformToKeyName(selectedGeneration)].version_groups;
	const [selectedVersion, setSelectedVersion] = useState(versions[0].name);
	const [filteredMethod, setFilteredMethod] = useState('level-up');
	
	// for pokemon that learns move(s) on evolution.
	let maxEvoLevel;
	if (speciesInfo.evolves_from_species!== null) {
		const chainData = state.evolutionChains[chainId];
		maxEvoLevel = 0;

		// find range
		const matchChains = chainData.chains.filter(chain => chain.includes(pokemonData.id));
		const rangeIds = new Set();

		matchChains.forEach(chain => {
			chain.forEach((id, index) => {
				// the first pokemon in the chain doesn't contain evolution detail
				if (index !== 0 && index <= chain.indexOf(pokemonData.id)) {
					rangeIds.add(id);
				};
			});
		});
		// find max evolution level in the range
		const chainDetails = [...rangeIds].map(id => chainData.details[id]);
		const findHeighestEvoLevel = chainDetails => {
			chainDetails.forEach(entry => {
				if (entry instanceof Array) {
					findHeighestEvoLevel(entry)
				} else {
					if (entry.min_level !== null && entry.min_level > maxEvoLevel) {
						maxEvoLevel = entry.min_level
					};
				};
			});
		};
		findHeighestEvoLevel(chainDetails);
	};

	const filterMoves = (method, version) => {
		// version can be string or array
		const conditions = {
			move_learn_method: method,
			version_group: version
		};

		const test = versionDetail => Object.keys(conditions).every(key => {
			if (conditions[key] instanceof Array) {
				return conditions[key].some(condition => versionDetail[key].name === condition)
			} else {
				return conditions[key] === versionDetail[key].name;
			};
		})

		const matches = pokemonData.moves.filter(move => move.version_group_details.some(test));
		const results = matches.map(move => ({...move, version_group_details: move.version_group_details.filter(test)}));
		return results;
	};
	
	const filteredMoves = filterMoves(filteredMethod, selectedVersion);

	const movesToFetch = useMemo(() => {
		return pokemonData.moves.filter(entry => !state.moves[transformToKeyName(entry.move.name)])
		.map(entry => entry.move.url);
	}, [pokemonData, state.moves]);

	const [isDataReady, setIsDataReady] = useState(!movesToFetch.length);

	let movesData, columnData;
	const movesDataCreator = moves => {
		const isFilteredByLevel = filteredMethod === 'level-up';
		const data = moves.map(entry => {
			const lookupName = transformToKeyName(entry.move.name);
			const cachedMove = state.moves[lookupName];
			const versionDetails = entry.version_group_details;

			// type
			const type = cachedMove.type.name;
			const typeData = <span value={type} data-tag="allowRowEvents" className={`type type-${type}`}>{getNameByLanguage(type, state.language, state.types[type]).toUpperCase()}</span>;

			// level-up; value attribute is used for sorting, if maxEvoLevel is 0, put it after level 1.
			const learnOnEvolution = <span data-tag="allowRowEvents" value={maxEvoLevel === 0 ? 2 : maxEvoLevel} title="Learned when Evolution" className="learnUponEvolution">Evo.</span>;
			const checkLearnOnEvo = level => {
				// there's some incorrect data in the API...
				return !maxEvoLevel && level === 0 ? 1 : maxEvoLevel && level === 0 ? learnOnEvolution : level;
			};
			// some moves can be learned at different levels.
			const levelData = versionDetails.length === 1 ? checkLearnOnEvo(versionDetails[0].level_learned_at) : versionDetails.map(detail => checkLearnOnEvo(detail.level_learned_at));

			// machine
			const machine = state.machines?.[lookupName]?.version_groups?.[selectedVersion];

			const machineData = (
				// value is for sorting
				<div value={machine} className="machineData">
					<div data-tag="allowRowEvents">{machine?.toUpperCase()}</div>
					<img data-tag="allowRowEvents" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tm-${type}.png`} alt={`tm-${type}`} className="machine"/>
				</div>
			);
			const dispalyData = isFilteredByLevel ? levelData : machineData;


			return {
				[isFilteredByLevel ? 'level' : 'machine']: dispalyData,
				move: capitalize(getNameByLanguage(entry.move.name, state.language, state.moves[transformToKeyName(entry.move.name)])),
				type: typeData,
				cat: cachedMove.damage_class.name,
				power: cachedMove.power !== null ? cachedMove.power : '—',
				acc: cachedMove.accuracy !== null ? `${cachedMove.accuracy}%` : '—',
				pp: cachedMove.pp,
				effect: cachedMove.effect_entries,
				flavorText: cachedMove.flavor_text_entries
			};
		});

		data.forEach((move, index) => {
			// moves that learned at differetn levels
			if (move.level instanceof Array) {
				move.level.forEach(level => {
					data.push({...move, level: level})
				})
				delete data[index];
			};
		});

		// initial sort
		return data.flat().sort((a, b) => {
			const initialSortingEntry = isFilteredByLevel ? 'level': 'machine'
			const rowA = typeof a[initialSortingEntry] === 'object' ? a[initialSortingEntry].props.value : a[initialSortingEntry];
			const rowB = typeof b[initialSortingEntry] === 'object' ? b[initialSortingEntry].props.value : b[initialSortingEntry];
			return isFilteredByLevel ? rowA - rowB : rowA?.localeCompare(rowB);
		});
	};

	const columnDataCreator = movesData => {
		const formatTableHeader = data => {
			switch (data) {
				case 'pp' : {
					return 'PP'
				}
				case 'acc' :
				case 'cat' :
					return capitalize(data).concat('.');
				default : 
					return capitalize(data)
			};
		};

		const sortNumsWithNull = data => (rowA, rowB) => {
			const a = rowA[data] === '—' ? 0 : rowA[data];
			const b = rowB[data] === '—' ? 0 : rowB[data];
			return a - b;
		};

		// when switching filter method, this function will run again if we sorted data, to avoid error, use optional chaining.
		const sortElement = data => (rowA, rowB) => {
			const a = rowA[data]?.props?.value;
			const b = rowB[data]?.props?.value;
			return a?.localeCompare(b);
		};

		// use movesData[0] as a template.
		return Object.keys(movesData[0]).reduce((pre, cur) => {
			if (cur !== 'flavorText' && cur !== 'effect') {
				pre.push({
					id: cur,
					name: formatTableHeader(cur),
					selector: row => row[cur],
					sortable: true,
					center: true,
					sortFunction: cur === 'type' || cur === 'machine' ? sortElement(cur) : cur === 'power' ? sortNumsWithNull(cur) : null
				});
			};
			return pre;
		}, []);
	};

	if (!movesToFetch.length) {
		movesData = movesDataCreator(filteredMoves);
		if (movesData.length) {
			columnData = columnDataCreator(movesData);
		};
	};

	useEffect(() => {
		if (movesToFetch.length) {
			const getMoves = async () => {
				const dataResponses = await Promise.all(movesToFetch.map(move => fetch(move)));
				const datas = dataResponses.map(response => response.json());
				const finalData = await Promise.all(datas);
				dispatch({type: 'movesLoaded', payload: finalData.reduce((pre, cur) => {
					pre[transformToKeyName(cur.name)] = cur;
					return pre;
				}, {})});
				setIsDataReady(true);
			};
			getMoves();
		};
	}, [dispatch, movesToFetch]);

	const getMachineData = async () => {
		// fetch all machines for current pokemon
		const allVersions = generationOptions.reduce((pre, cur) => {
			pre.push(...state.generations[transformToKeyName(cur)].version_groups.map(version => version.name));
			return pre;
		}, []);

		const nextFilteredMoves = filterMoves('machine', allVersions);
		const isMachineDataReady = nextFilteredMoves.every(entry => entry.version_group_details.every(detail => Boolean(state.machines?.[transformToKeyName(entry.move.name)]?.version_groups?.[detail.version_group.name])));

		if (!isMachineDataReady) {
			setIsDataReady(false);
			// the latest generation may not contain machine data.
			const movesLackData = [];
			const machinesToFetch = [];

			nextFilteredMoves.forEach(entry => entry.version_group_details.forEach(detail => {
				const match = state.moves[transformToKeyName(entry.move.name)].machines.find(machine => machine.version_group.name === detail.version_group.name);
				if (match) {
					machinesToFetch.push(match.machine.url);
				} else {
					movesLackData.push({[transformToKeyName(entry.move.name)]: detail.version_group.name});
				};
			}));

			const dataResponses = await Promise.all(machinesToFetch.map(url => fetch(url)));
			const datas = dataResponses.map(response => response.json());
			const finalData = await Promise.all(datas);
			const machineData = finalData.reduce((pre, cur) => {
				const keyName = transformToKeyName(cur.move.name);
				if (!pre[keyName]) {
					pre[keyName] = {};
				} else if (!pre[keyName].version_groups) {
					pre[keyName].version_groups = {};
				};
				pre[keyName].version_groups = {
					...pre[keyName].version_groups,
					[cur.version_group.name]: cur.item.name
				};
				return pre;
			}, {});

			movesLackData.forEach(entry => machineData[transformToKeyName(Object.keys(entry)[0])] = {
				version_groups: {
					...machineData[transformToKeyName(Object.keys(entry)[0])]?.version_groups, [Object.values(entry)[0]]: 'no data'
				}
			});

			dispatch({type: 'machineDataLoaded', payload: machineData});
			setIsDataReady(true);
		};
	};

	const changeGeneration = generation => {
		const nextVersion = state.generations[transformToKeyName(generation)].version_groups[0].name;
		setSelectedGeneration(generation);
		setSelectedVersion(nextVersion);
	};

	const changeVersion = version => {
		setSelectedVersion(version);
	};

	const changefilteredMethod = e => {
		setFilteredMethod(e.target.checked ? 'machine' : 'level-up');
		if (e.target.checked) {
			getMachineData();
		};
	};

	return (
		<>
			<div className="moves text-center mt-5">
				<h1>Moves</h1>
				<div>
					{generationOptions.map(generation => (
						<button 
							className={`generationBtn btn btn-outline-secondary m-1 ${selectedGeneration === generation ? 'active' : ''}`}
							disabled={!isDataReady}
							key={generation}
							onClick={() => changeGeneration(generation)}
						>{(generation.replace('generation-', '')).toUpperCase()}</button>
					))}
				</div>
				<div className='col-12 varieties'>
					<ul>
						{versions.map(version => (
							<React.Fragment key={version.name}>
								<li className={version.name === selectedVersion ? 'active' : ''}>
									<button disabled={!isDataReady} className='text-capitalize' onClick={() => changeVersion(version.name)}>{version.name}</button>
								</li>
							</React.Fragment>
						))}
					</ul>
				</div>
				<MovesTable 
					changefilteredMethod={changefilteredMethod} 
					filteredMethod={filteredMethod} 
					selectedVersion={selectedVersion}
					movesData={movesData}
					columnData={columnData}
					isDataReady={isDataReady}
				/>
			</div>
		</>
	)
};