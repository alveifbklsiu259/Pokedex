import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { capitalize } from "@mui/material";
import { selectGenerations, selectPokemons, selectLanguage, selectTypes, selectVersions, selectMoves, selectMoveDamageClass, selectMachines, movesLoaded, machineDataLoaded, selectSpeciesById, selectChainDataByChainId } from "../features/pokemonData/pokemonDataSlice";
import { transformToKeyName, getIdFromURL, getNameByLanguage } from "../util";
import MovesTable from "./MovesTable";

const columnDataCreator = filteredMethod => {
	const formatTableHeader = data => {
		switch (data) {
			case 'pp' : 
				return 'PP'
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

	// when switching filter method, this function will run again if data is sorted, to avoid error, use optional chaining.
	const sortElement = data => (rowA, rowB) => {
		const a = rowA[data]?.props?.value || rowA[data];
		const b = rowB[data]?.props?.value || rowB[data];
		return String(a)?.localeCompare(String(b), undefined, {numeric: true});
	};

	const column = [(filteredMethod === 'level-up' ? 'level' : 'machine'), 'move', 'type', 'cat', 'power', 'acc', 'pp'];

	return column.reduce((pre, cur) => {
		pre.push({
			id: cur,
			name: formatTableHeader(cur),
			selector: row => row[cur],
			sortable: true,
			center: true,
			sortFunction: cur === 'type' || cur === 'machine' || cur === 'level' ? sortElement(cur) : cur === 'power' ? sortNumsWithNull(cur) : null
		});
		return pre;
	}, []);
};

const Moves = memo(function Moves({pokeId, chainId}) {
	const dispatch = useDispatch();
	const language = useSelector(selectLanguage);
	const types = useSelector(selectTypes);
	const cachedVersions = useSelector(selectVersions);
	const chainData = useSelector(state => selectChainDataByChainId(state, chainId));
	const cachedMoves = useSelector(selectMoves);
	const movesDamageClass = useSelector(selectMoveDamageClass);
	const machines = useSelector(selectMachines);
	const cachedGenerations = useSelector(selectGenerations);
	const generations = useMemo(() => Object.values(cachedGenerations), [cachedGenerations]);
	const speciesData = useSelector(state => selectSpeciesById(state, pokeId));
	const pokemons = useSelector(selectPokemons);
	let pokemon = pokemons[pokeId];
	let debutGeneration = speciesData.generation.name;
	if (!pokemon.is_default) {
		if (!pokemon.formData?.is_battle_only) {
			debutGeneration = generations.find(generation => generation.version_groups.some(version => version.name === pokemon.formData.version_group.name)).name;
		} else {
			// use the default form's pokemon data.
			pokemon = pokemons[getIdFromURL(pokemon.species.url)];
		};
	};
	const generationNames = useMemo(() => generations.map(generation => generation.name), [generations]);
	const generationOptions = useMemo(() => generationNames.slice(generationNames.indexOf(debutGeneration)), [generationNames, debutGeneration]) ;
	const [selectedGeneration, setSelectedGeneration] = useState(debutGeneration);
	const versions = cachedGenerations[transformToKeyName(selectedGeneration)].version_groups;
	const versionOptions = useMemo(() => generationOptions.reduce((pre, cur) => {
		pre.push(...cachedGenerations[transformToKeyName(cur)].version_groups.map(version => version.name));
		return pre;
	}, []), [generationOptions, cachedGenerations]);
	const [selectedVersion, setSelectedVersion] = useState(versions[0].name);
	const [filteredMethod, setFilteredMethod] = useState('level-up');

	const getVersionName = useCallback(version => {
		if (language !== 'en') {
			const matchedVersions = Object.values(cachedVersions).filter(entry => entry.version_group.name === version);
			let versionName = '';
			matchedVersions.forEach((entry, index, array) => {
				versionName += getNameByLanguage(entry.name, language, cachedVersions[transformToKeyName(entry.name)]);
				if (index < array.length - 1) {
					versionName += '/';
				};
			});
			return versionName;
		} else {
			return version;
		};
	}, [cachedVersions, language]);
	
	// for pokemon that learns move(s) on evolution.
	let maxEvoLevel;
	if (speciesData.evolves_from_species !== null) {
		maxEvoLevel = 0;

		// find range.
		const matchChains = chainData.chains.filter(chain => chain.includes(speciesData.id));
		const rangeIds = new Set();

		matchChains.forEach(chain => {
			chain.forEach((id, index) => {
				// the first pokemon in the chain doesn't contain evolution detail.
				if (index !== 0 && index <= chain.indexOf(speciesData.id)) {
					rangeIds.add(id);
				};
			});
		});
		// find max evolution level in the range.
		const chainDetails = [...rangeIds].map(id => chainData.details[id]);
		const findHeighestEvoLevel = chainDetails => {
			chainDetails.forEach(entry => {
				if (entry instanceof Array) {
					findHeighestEvoLevel(entry);
				} else {
					if (entry.min_level !== null && entry.min_level > maxEvoLevel) {
						maxEvoLevel = entry.min_level;
					};
				};
			});
		};
		findHeighestEvoLevel(chainDetails);
	};

	const filterMoves = useCallback((method, version) => {
		// version can be string or array.
		const conditions = {
			move_learn_method: method,
			version_group: version
		};

		const test = versionDetail => Object.keys(conditions).every(key => {
			if (conditions[key] instanceof Array) {
				return conditions[key].some(condition => versionDetail[key].name === condition);
			} else {
				return conditions[key] === versionDetail[key].name;
			};
		});

		const matches = pokemon.moves.filter(move => move.version_group_details.some(test));
		const results = matches.map(move => ({...move, version_group_details: move.version_group_details.filter(test)}));
		return results;
	}, [pokemon]);
	const filteredMoves = filterMoves(filteredMethod, selectedVersion);
	const movesLearnedByMachine = useMemo(() => filterMoves('machine', versionOptions), [filterMoves, versionOptions]);

	// all moves for current pokemon.
	const movesToFetch = useMemo(() => {
		return pokemon.moves.filter(entry => !cachedMoves[transformToKeyName(entry.move.name)])
		.map(entry => entry.move.url);
	}, [pokemon, cachedMoves]);
	
	const isMachineDataReady = movesLearnedByMachine.every(entry => entry.version_group_details.every(detail => Boolean(machines?.[transformToKeyName(entry.move.name)]?.version_groups?.[detail.version_group.name])));

	const movesDataCreator = moves => {
		const isFilteredByLevel = filteredMethod === 'level-up';
		const data = moves.map(entry => {
			const lookupName = transformToKeyName(entry.move.name);
			const cachedMove = cachedMoves[lookupName];
			const versionDetails = entry.version_group_details;

			const moveName = capitalize(getNameByLanguage(entry.move.name, language, cachedMoves[transformToKeyName(entry.move.name)]));

			// type
			const type = cachedMove.type.name;
			const typeData = <span value={type} data-tag="allowRowEvents" className={`type type-${type}`}>{getNameByLanguage(type, language, types[type]).toUpperCase()}</span>;

			// level-up; value attribute is used for sorting, if maxEvoLevel is 0, put it after level 1.
			const learnOnEvolution = <span data-tag="allowRowEvents" value={maxEvoLevel === 0 ? 2 : maxEvoLevel} title="Learned when Evolution" className="learnUponEvolution">Evo.</span>;
			const checkLearnOnEvo = level => {
				// there's some incorrect data in the API...
				return !maxEvoLevel && level === 0 ? 1 : maxEvoLevel && level === 0 ? learnOnEvolution : level;
			};
			// some moves can be learned at different levels.
			const levelData = versionDetails.length === 1 ? checkLearnOnEvo(versionDetails[0].level_learned_at) : versionDetails.map(detail => checkLearnOnEvo(detail.level_learned_at));

			// category
			const categoryText = getNameByLanguage(cachedMove.damage_class.name, language, movesDamageClass[cachedMove.damage_class.name]);

			// machine
			const machine = machines?.[lookupName]?.version_groups?.[selectedVersion];

			const machineData = (
				// value is for sorting
				<div value={machine} className="machineData">
					<div data-tag="allowRowEvents">{machine?.toUpperCase()}</div>
					<img data-tag="allowRowEvents" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tm-${type}.png`} alt={`tm-${type}`} className="machine"/>
				</div>
			);
			const dispalyData = isFilteredByLevel ? levelData : machineData;

			return {
				// id is used as an key for React Data Table.
				id: moveName,
				[isFilteredByLevel ? 'level' : 'machine']: dispalyData,
				move: moveName,
				type: typeData,
				cat: categoryText,
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
					data.push({...move, level: level, id: move.move.concat(`-${level}`)})
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

	const columnData = useMemo(() => columnDataCreator(filteredMethod), [filteredMethod]);
	const movesData = !movesToFetch.length ? movesDataCreator(filteredMoves) : undefined;

	useEffect(() => {
		if (movesToFetch.length) {
			const getMoves = async () => {
				const dataResponses = await Promise.all(movesToFetch.map(move => fetch(move)));
				const datas = dataResponses.map(response => response.json());
				const finalData = await Promise.all(datas);
				dispatch(movesLoaded(finalData));
			};
			getMoves();
		};
	}, [dispatch, movesToFetch]);

	const changeGeneration = generation => {
		const nextVersion = cachedGenerations[transformToKeyName(generation)].version_groups[0].name;
		setSelectedGeneration(generation);
		setSelectedVersion(nextVersion);
	};

	const changeVersion = version => {
		setSelectedVersion(version);
	};

	const changefilteredMethod = useCallback(async e => {
		setFilteredMethod(e.target.checked ? 'machine' : 'level-up');
		if (e.target.checked && !isMachineDataReady) {
			// the latest generation may not contain machine data.
			const movesLackData = [];
			const machinesToFetch = [];

			movesLearnedByMachine.forEach(entry => entry.version_group_details.forEach(detail => {
				const match = cachedMoves[transformToKeyName(entry.move.name)].machines.find(machine => machine.version_group.name === detail.version_group.name);
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
			dispatch(machineDataLoaded(machineData));
		};
	}, [cachedMoves, dispatch, isMachineDataReady, movesLearnedByMachine]);

	const isDataReady = filteredMethod === 'level-up' ? !!movesData : !!movesData && isMachineDataReady;

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
									<button disabled={!isDataReady} className='text-capitalize' onClick={() => changeVersion(version.name)}>{getVersionName(version.name)}</button>
								</li>
							</React.Fragment>
						))}
					</ul>
				</div>
				{/*  */}
				{movesData && (
					<MovesTable
						movesData={movesData}
						columnData={columnData}
						changefilteredMethod={changefilteredMethod} 
						filteredMethod={filteredMethod} 
						selectedVersion={selectedVersion}
						isDataReady={isDataReady}
					/>
				)}
			</div>
		</>
	)
});
export default Moves;