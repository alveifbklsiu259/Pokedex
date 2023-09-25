import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import { capitalize } from "@mui/material";
import { selectGenerations, selectPokemons, selectTypes, selectVersions, selectMoves, selectMoveDamageClass, selectMachines, selectSpeciesById, selectChainDataByChainId, movesLoaded, machineDataLoaded, CachedMachine } from "./pokemonDataSlice";
import { selectLanguage } from "../display/displaySlice";
import { transformToKeyName, getIdFromURL, getNameByLanguage } from "../../util";
import MovesTable from "./MovesTable";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import type { TableColumn } from "react-data-table-component";
import type { Pokemon, Machine, Move } from "../../../typeModule";

export type ColData = {
	level?: number | React.JSX.Element,
	machine?: React.JSX.Element,
	type: React.JSX.Element,
	move: string,
	cat: string
	power: number | string,
	acc: string,
	pp: number
};

export type MovesData = ColData & {
	id: string,
	effect: Move.EffectEntry[]
	flavorText: Move.FlavorTextEntry[];
};


const columnDataCreator = (filteredMethod: 'level-up' | 'machine'): TableColumn<ColData>[] => {
	const column = [(filteredMethod === 'level-up' ? 'level' : 'machine'), 'move', 'type', 'cat', 'power', 'acc', 'pp'] as const;

	const formatTableHeader = (data: keyof ColData) => {
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

	const sortNumsWithNull = (data: 'power') => (rowA: ColData, rowB: ColData) => {
		const a = rowA[data] === '—' ? 0 : rowA[data] as number;
		const b = rowB[data] === '—' ? 0 : rowB[data] as number;
		return a - b;
	};

	// when switching filter method, this function will run again if data is sorted, to avoid error, use optional chaining.
	const sortElement = (data: 'type' | 'machine' | 'level') => (rowA: ColData, rowB: ColData) => {
		const a: number | string = typeof rowA[data] === 'object' ? (rowA[data] as React.JSX.Element).props['data-value'] : rowA[data];
		const b: number | string = typeof rowB[data] === 'object' ? (rowB[data] as React.JSX.Element).props['data-value'] : rowB[data];
		return String(a).localeCompare(String(b), undefined, {numeric: true});
	};

	return column.reduce<TableColumn<ColData>[]>((pre, cur) => {
		pre.push({
			id: cur,
			name: formatTableHeader(cur),
			// the declaration file of rdt specifies that the return type of "selector" can only be Primitive, but in my use case, I want to show React.JSX.Element in some of the field.
			selector: row => row[cur] as any,
			sortable: true,
			center: true,
			sortFunction: cur === 'type' || cur === 'machine' || cur === 'level' ? sortElement(cur) : cur === 'power' ? sortNumsWithNull(cur) : undefined
		});
		return pre;
	}, []);
};

type MoveProps = {
	pokeId: string,
	chainId: number
}

const Moves = memo<MoveProps>(function Moves({pokeId, chainId}) {
	const dispatch = useAppDispatch();
	const language = useAppSelector(selectLanguage);
	const types = useAppSelector(selectTypes);
	const cachedVersions = useAppSelector(selectVersions);
	const chainData = useAppSelector(state => selectChainDataByChainId(state, chainId))!;
	const cachedMoves = useAppSelector(selectMoves);
	const movesDamageClass = useAppSelector(selectMoveDamageClass);
	const machines = useAppSelector(selectMachines);
	const cachedGenerations = useAppSelector(selectGenerations);
	const generations = useMemo(() => Object.values(cachedGenerations), [cachedGenerations]);
	const speciesData = useAppSelector(state => selectSpeciesById(state, pokeId));
	const pokemons = useAppSelector(selectPokemons);
	let pokemon = pokemons[pokeId];
	let debutGeneration = speciesData.generation.name;
	if (!pokemon.is_default) {
		if (pokemon.formData && pokemon.formData.is_battle_only === false) {
			debutGeneration = generations.find(generation => generation.version_groups.some(version => version.name === pokemon.formData!.version_group.name))!.name;
		} else {
			// use the default form's pokemon data.
			pokemon = pokemons[getIdFromURL(pokemon.species.url)];
		};
	};
	const generationNames = useMemo(() => generations.map(generation => generation.name), [generations]);
	const generationOptions = useMemo(() => generationNames.slice(generationNames.indexOf(debutGeneration)), [generationNames, debutGeneration]) ;
	const [selectedGeneration, setSelectedGeneration] = useState(debutGeneration);
	const versions = cachedGenerations[transformToKeyName(selectedGeneration)].version_groups;
	const versionOptions = useMemo(() => generationOptions.reduce<string[]>((pre, cur) => {
		pre.push(...cachedGenerations[transformToKeyName(cur)].version_groups.map(version => version.name));
		return pre;
	}, []), [generationOptions, cachedGenerations]);
	const [selectedVersion, setSelectedVersion] = useState(versions[0].name);
	const [filteredMethod, setFilteredMethod] = useState<'level-up' | 'machine'>('level-up');

	const getVersionName = useCallback((version: string) => {
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
	let maxEvoLevel: undefined | number;
	if (speciesData.evolves_from_species !== null) {
		maxEvoLevel = 0;

		// find range.
		const matchChains = chainData.chains.filter(chain => chain.includes(speciesData.id));
		const rangeIds = new Set<number>();

		matchChains.forEach(chain => {
			chain.forEach((id, index) => {
				// the first pokemon in the chain doesn't contain evolution detail.
				if (index !== 0 && index <= chain.indexOf(speciesData.id)) {
					rangeIds.add(id);
				};
			});
		});

		type ChainDetails = typeof chainData.details[number][];
		// find max evolution level in the range.
		const chainDetails = [...rangeIds].map(id => chainData.details[id]);
		const findHeighestEvoLevel = (chainDetails:ChainDetails | ChainDetails[number]) => {
			chainDetails.forEach(entry => {
				if (entry instanceof Array) {
					findHeighestEvoLevel(entry);
				} else {
					if (entry.min_level !== null && entry.min_level > maxEvoLevel!) {
						maxEvoLevel = entry.min_level;
					};
				};
			});
		};
		findHeighestEvoLevel(chainDetails);
	};

	const filterMoves = useCallback((method: typeof filteredMethod, version: string | string[]) => {
		const conditions = {
			move_learn_method: method,
			version_group: version
		};
		type ConditionKey = keyof typeof conditions;
		
		const test = (versionDetail: Pokemon.VersionGroupDetail) => Object.keys(conditions).every(key => {
			const entry = conditions[key as ConditionKey];
			if (Array.isArray(entry)) {
				return entry.some(condition => versionDetail[key as ConditionKey].name === condition);
			} else {
				return entry === versionDetail[key as ConditionKey].name;
			};
		});

		const matches = pokemon.moves.filter(move => move.version_group_details.some(test));
		const results = matches.map(move => ({...move, version_group_details: move.version_group_details.filter(test)}));
		return results;
	}, [pokemon]);

	const filteredMoves = filterMoves(filteredMethod, selectedVersion);
	const movesLearnedByMachine = useMemo(() => filterMoves('machine', versionOptions), [filterMoves, versionOptions]);

	// all moves for current pokemon.
	const movesToFetch = useMemo(() => pokemon.moves.filter(entry => !cachedMoves[transformToKeyName(entry.move.name)]).map(entry => entry.move.url), [pokemon, cachedMoves]);
	const isMachineDataReady = movesLearnedByMachine.every(entry => entry.version_group_details.every(detail => Boolean(machines?.[transformToKeyName(entry.move.name)]?.version_groups?.[transformToKeyName(detail.version_group.name)])));

	const movesDataCreator = (moves: typeof filteredMoves): MovesData[] => {
		const isFilteredByLevel = filteredMethod === 'level-up';
		const data = moves.map(entry => {
			const lookupName = transformToKeyName(entry.move.name);
			const cachedMove = cachedMoves[lookupName];
			const versionDetails = entry.version_group_details;

			const moveName = capitalize(getNameByLanguage(entry.move.name, language, cachedMoves[transformToKeyName(entry.move.name)]));

			// type
			const type = cachedMove.type.name;
			const typeData = <span data-value={type} data-tag="allowRowEvents" className={`type type-${type}`}>{getNameByLanguage(type, language, types[type]).toUpperCase()}</span>;

			// level-up; data-value attribute is used for sorting, if maxEvoLevel is 0, put it after level 1.
			const learnOnEvolution = <span data-tag="allowRowEvents" data-value={maxEvoLevel === 0 ? 2 : maxEvoLevel} title="Learned when Evolution" className="learnUponEvolution">Evo.</span>;
			const checkLearnOnEvo = (level: number) => {
				// there's some incorrect data in the API... (when level === 0, it means that this move is acquired when evolution)
				return level === 0 ? maxEvoLevel === undefined ? 1 : learnOnEvolution : level;
			};
			// some moves can be learned at different levels.
			const levelData = versionDetails.length === 1 ? checkLearnOnEvo(versionDetails[0].level_learned_at) : versionDetails.map(detail => checkLearnOnEvo(detail.level_learned_at));

			// category
			const categoryText = getNameByLanguage(cachedMove.damage_class.name, language, movesDamageClass[cachedMove.damage_class.name]);

			// machine
			const machine = machines[lookupName]?.version_groups?.[transformToKeyName(selectedVersion)];
			const machineData = (
				// value is for sorting
				<div data-value={machine || 'NO DATA'} className="machineData">
					{/* || 'No Data' */}
					<div data-tag="allowRowEvents">{machine?.toUpperCase() || 'NO DATA'}</div>
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
		
		// is there anyway to make machin or level optional, not index signature

		data.forEach((move, index) => {
			// moves that learned at differetn levels
			if (move.level instanceof Array) {
				(move.level as (number | React.JSX.Element)[]).forEach(level => {
					const lv = typeof level === 'object' ? 0 : level;
					data.push({...move, level: level, id: move.move.concat(`-${lv}`)})
				})
				delete data[index];
			};
		});
		
		// initial sort
		return data.flat().sort((a, b) => {
			const initialSortingEntry = isFilteredByLevel ? 'level': 'machine';

			const rowA = typeof a[initialSortingEntry] === 'object' ? (a[initialSortingEntry] as React.JSX.Element).props['data-value'] : a[initialSortingEntry] as number;
			const rowB = typeof b[initialSortingEntry] === 'object' ? (b[initialSortingEntry] as React.JSX.Element).props['data-value'] : b[initialSortingEntry] as number;
			return isFilteredByLevel ? rowA - rowB : rowA?.localeCompare(rowB);
		});
	};

	const columnData = useMemo(() => columnDataCreator(filteredMethod), [filteredMethod]);
	const movesData = !movesToFetch.length ? movesDataCreator(filteredMoves) : undefined;

	// console.log(columnData)
	// console.log(movesData?.[0])

	useEffect(() => {
		if (movesToFetch.length) {
			const getMoves = async () => {
				const dataResponses = await Promise.all(movesToFetch.map(move => fetch(move)));
				const datas = dataResponses.map(response => response.json());
				const finalData: (typeof cachedMoves)[number][] = await Promise.all(datas);
				dispatch(movesLoaded(finalData));
			};
			getMoves();
		};
	}, [dispatch, movesToFetch]);

	const changeGeneration = (generation: string) => {
		const nextVersion = cachedGenerations[transformToKeyName(generation)].version_groups[0].name;
		setSelectedGeneration(generation);
		setSelectedVersion(nextVersion);
	};

	const changeVersion = (version: string) => {
		setSelectedVersion(version);
	};

	const changefilteredMethod = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilteredMethod(e.target.checked ? 'machine' : 'level-up');
		if (e.target.checked && !isMachineDataReady) {
			/* We've already fetched all the moves for the curren pokemon in useEffect, now we're getting machine data(TM/HM).
			   The latest generation may not contain machine data. */
			const movesLackData: {
				[name: string]: string
			}[] = [];
			const machinesToFetch: string[] = [];
			let fetchedMachines: Machine.Root[] | undefined = undefined;
			const machineData: CachedMachine = {};

			movesLearnedByMachine.forEach(entry => entry.version_group_details.forEach(detail => {
				const match = cachedMoves[transformToKeyName(entry.move.name)].machines.find(machine => machine.version_group.name === detail.version_group.name);
				if (match) {
					machinesToFetch.push(match.machine.url);
				} else {
					movesLackData.push({[transformToKeyName(entry.move.name)]: detail.version_group.name});
				};
			}));

			if (machinesToFetch.length) {
				const dataResponses = await Promise.all(machinesToFetch.map(url => fetch(url)));
				const datas = dataResponses.map(response => response.json());
				fetchedMachines = await Promise.all(datas);
				fetchedMachines.forEach(machine => {
					const keyName = transformToKeyName(machine.move.name);
					if (!machineData[keyName]) {
						machineData[keyName] = {version_groups: {}};
					};
					machineData[keyName].version_groups = {
						...machineData[keyName].version_groups,
						// transformToDash?
						[transformToKeyName(machine.version_group.name)]: machine.item.name
					};
				});
			};

			if (movesLackData.length) {
				movesLackData.forEach(entry => machineData[transformToKeyName(Object.keys(entry)[0])] = {
					version_groups: {
						...machineData[transformToKeyName(Object.keys(entry)[0])]?.version_groups, [transformToKeyName(Object.values(entry)[0])]: 'no data'
					}
				});
			};
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