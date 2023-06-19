import React, { useState, useEffect } from "react";
import DataTable from 'react-data-table-component';
import { Switch, Stack, Typography, capitalize } from "@mui/material";
import { usePokemonData, useDispatchContenxt } from "./PokemonsProvider";
import Spinner from "./Spinner";
import { transformToKeyName, getIdFromURL } from "../util";

export default function Moves({speciesInfo, pokemon, chainId}) {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const generations = Object.values(state.generations);
	let pokemonData = pokemon;
	let debutGeneration = speciesInfo.generation.name;
	if (!pokemon.is_default) {
		if (pokemon.formData && !pokemon.formData.is_battle_only) {
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
	const [filterMethod, setFilterMethod] = useState('level-up');
	
	// for pokemon that learns move(s) on evolution.
	let maxEvoLevel;
	if (speciesInfo.evolves_from_species !== null) {
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

	// filter moves based on current filter method && version
	const filterMoves = (method, version) => {
		const test = versionDetail => versionDetail.version_group.name === version && versionDetail.move_learn_method.name === method;
		return pokemonData.moves
			.filter(move => move.version_group_details.some(test))
			.map(move => ({...move, version_group_details: move.version_group_details.filter(test)}));
	};
	const filteredMoves = filterMoves(filterMethod, selectedVersion);

	const movesToFetch = filteredMoves.filter(entry => !state.moves[transformToKeyName(entry.move.name)])
	.map(entry => entry.move.url);

	let movesData, columnData;
	const movesDataCreator = moves => {
		const data = moves.map(entry => {
			const lookupName = transformToKeyName(entry.move.name);
			const cachedMove = state.moves[lookupName];
			const versionDetails = entry.version_group_details;

			// type
			const type = cachedMove.type.name;
			const typeData = <span value={type} data-tag="allowRowEvents" className={`type type-${type}`}>{type.toUpperCase()}</span>;

			// level-up; value attribute is used for sorting, if maxEvoLevel is 0, put it after level 1.
			const learnOnEvolution = <span data-tag="allowRowEvents" value={maxEvoLevel === 0 ? 2 : maxEvoLevel} title="Learned when Evolution" className="learnUponEvolution">Evo.</span>;
			const checkLearnOnEvo = level => {
				return level === 0 ? learnOnEvolution : level;
			};
			// some moves can be learned at different levels.
			const levelData = versionDetails.length === 1 ? checkLearnOnEvo(versionDetails[0].level_learned_at) : versionDetails.map(detail => checkLearnOnEvo(detail.level_learned_at));

			// machine
			const machine = state.machines.entities?.[lookupName]?.version_groups?.[selectedVersion];

			const machineData = (
				// value is for sorting
				<div value={machine}>
					<span data-tag="allowRowEvents">{machine?.toUpperCase()}</span>
					<img data-tag="allowRowEvents" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tm-${type}.png`} alt={`tm-${type}`} className="machine"/>
				</div>
			);
			const isFilteredByLevel = filterMethod === 'level-up';
			const dispalyData = isFilteredByLevel ? levelData : machineData

			return {
				[isFilteredByLevel ? 'level' : 'machine']: dispalyData,
				move: entry.move.name,
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

		// sort the data based on level, if the pokemon learn move on evolution, put this move at where it should be, which is the minimum level we can get this pokemon.
		return data.flat().sort((a, b) => {
			const levelA = typeof a.level === 'object' ? a.level.props.value : a.level;
			const levelB = typeof b.level === 'object' ? b.level.props.value : b.level;
			return levelA - levelB;
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

		// when switching filter method, this function will run again if we sorted data, to avoid error, use optional chaining
		const sortElement = data => (rowA, rowB) => {
			const a = rowA[data]?.props?.value;
			const b = rowB[data]?.props?.value;
			return a?.localeCompare(b);
		};

		// just use movesData[0] as a template
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

	// (without DataList)
	// initial-render: mounts --> Effect --> re-renders 
	// re-render: if !dataReady: re-renders --> Effect --> re-renders

	// click ==>  !dataReady --> fetch + render --> Effect will not run


// see if remove tabs that don't show?
	// gen 8 doesn't support pokemons transfer?
	// memoize cachedMoves

	// do i use reduce function a lot, may create a util?
		
	// active btn, disable btn, disable text input in Pokemons.
	
	// find a way to chache moves when version changes

	// separate dataTable

	// handle expandable


	function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {
		// console.log(phase)
	}

	useEffect(() => {
		if (movesToFetch.length) {
			console.log('inner Effect')
			const getMoves = async () => {
				const dataResponses = await Promise.all(movesToFetch.map(move => fetch(move)));
				const datas = dataResponses.map(response => response.json());
				const finalData = await Promise.all(datas);
				dispatch({type: 'movesLoaded', payload: finalData.reduce((pre, cur) => {
					pre[transformToKeyName(cur.name)] = cur;
					return pre;
				}, {})});
			};
			getMoves();
		};
	}, [dispatch, filteredMoves, movesToFetch]);

	const changeGeneration = generation => {
		setSelectedGeneration(generation);
		const versions = state.generations[transformToKeyName(generation)].version_groups;
		setSelectedVersion(versions[0].name);
	};

	const changeVersion = version => {
		setSelectedVersion(version);
	};
	console.log(state)
	const changeFilterMethod = async e => {
		setFilterMethod(e.target.checked ? 'machine' : 'level-up');
		if (e.target.checked) {
			const movesFilteredByMachine = filterMoves('machine', selectedVersion);
			const isMachineDataReady = movesFilteredByMachine.every(entry => Boolean(state.machines.entities?.[transformToKeyName(entry.move.name)]?.version_groups?.[selectedVersion]));

			if (!isMachineDataReady || !Object.keys(state.machines.entities).length) {
				let requests;
				const rejectedRequests = [];
				const fetchMachineData = async (requests, rejectedRequestsArray) => {
					// since there're 1500+ requests, use allSetteld to avoid one fails all fail, and re-fetch the next time if data is not complete.
					const dataResponses = await Promise.allSettled(requests);
					const datas = dataResponses.filter((response, index) => {
						if (response.status === 'rejected') {
							// the fulfillment values come in the order of the promises passed, regardless of completion order, so we can use the index to check which request is rejected.
							rejectedRequestsArray.push(index + 1);
						};
						return response.status === 'fulfilled';
					}).map(response => response.value.json());

					const finalData = await Promise.all(datas);
					return finalData.reduce((pre, cur) => {
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
				};
				
				if (state.machines.rejectedRequests.length) {
					requests = state.machines.rejectedRequests.map(request => fetch(`https://pokeapi.co/api/v2/machine/${request}`));
				} else {
					const machineResponse = await fetch('https://pokeapi.co/api/v2/machine?limit=9999');
					const data = await machineResponse.json();
					requests = data.results.map(machine => fetch(machine.url));
				};
				const machineData = await fetchMachineData(requests, rejectedRequests);
				dispatch({type: 'machineDataLoaded', payload: {entities: machineData, rejectedRequests: rejectedRequests}});
			};
		};
	};

	return (
		<React.Profiler id='moves' onRender={onRender}>
			<div className="moves text-center mt-5">
				<h1>Moves</h1>
				<div>{generationOptions.map(generation => (
					<button 
						className={`generationBtn btn btn-outline-secondary m-1 ${selectedGeneration === generation ? 'active' : ''}`} 
						key={generation}
						onClick={() => changeGeneration(generation)}
					>{(generation.replace('generation-', '')).toUpperCase()}</button>
				))}</div>
				<div className='col-12 varieties'>
					<ul>
						{versions.map(version => (
							<React.Fragment key={version.name}>
								<li className={version.name === selectedVersion ? 'selected' : ''}>
									<button className='text-capitalize' onClick={() => changeVersion(version.name)}>{version.name}</button>
								</li>
							</React.Fragment>
						))}
						
					</ul>
				</div>
				<DataTable
					columns={columnData}
					data={movesData}
					highlightOnHover
					expandableRows
					expandOnRowClicked
					expandableRowsHideExpander
					expandableRowsComponent={MoveEffect}
					expandableRowsComponentProps={{selectedVersion}}
					title={`Moves Learn by ${capitalize(filterMethod)}`}
					subHeader
					subHeaderComponent={(
						<Stack direction="row" spacing={1} alignItems="center">
							<Typography>Level</Typography>
								<Switch onChange={changeFilterMethod} />
							<Typography>Machine</Typography>
						</Stack>
					)}
					progressPending={movesData ? false : true}
					progressComponent={<Spinner />}
				/>
			</div>
		</React.Profiler>
	)
}

const MoveEffect = ({data, selectedVersion}) => {
	const language = 'en';
	const effect = data.effect.find(entry => entry.language.name === language)?.effect || 'No data to show';
	const flavorText = data.flavorText.find(entry => {
		if (entry.version_group.name === selectedVersion) {
			return entry.language.name === language && entry.version_group.name === selectedVersion
		} else {
			return entry.language.name === language
		}
	})?.flavor_text || 'No data to show';

	return (
		<div className="moveDes">
			{data?.level?.type === 'span' && (
				<ul className="evo">
					Evo.
					<li>{data.level.props.title}</li>
				</ul>
			)}
			<ul className="effect">
				Effect
				<li>{effect}</li>
			</ul>
			<ul className="description">
				Description
				<li>{flavorText}</li>
			</ul>
		</div>
	)
}