import React, { useState, useEffect } from "react";
import { usePokemonData, useDispatchContenxt } from "./PokemonsProvider";
import DataTable from 'react-data-table-component';
import Spinner from "./Spinner";
import { transformKeyName, getIdFromURL } from "../util";

const columns = [
	{
		name: 'Level',
		selector: row => row.level,
		sortable: true,
		center: true,
	},
	{
		name: 'Move',
		selector: row => row.move,
		sortable: true,
		center: true,
	},
	{
		name: 'Type',
		selector: row => row.type,
		sortable: true,
		center: true,
		sortFunction: (rowA, rowB) => {
			const a = rowA.type.props.children;
			const b = rowB.type.props.children;
			return a.localeCompare(b)
		}
	},
	{
		name: 'Cat.',
		selector: row => row.cat,
		sortable: true,
		center: true,
	},
	{
		name: 'Power',
		selector: row => row.power,
		sortable: true,
		center: true,
		sortFunction: (rowA, rowB) => {
			const a = rowA.power === '—' ? 0 : rowA.power;
			const b = rowB.power === '—' ? 0 : rowB.power;
			return a - b;
		}
	},
	{
		name: 'Acc.',
		selector: row => row.acc,
		sortable: true,
		center: true,
	},
	{
		name: 'PP',
		selector: row => row.pp,
		sortable: true,
		center: true,
	},
	// des
];

export default function Moves({speciesInfo, pokemon, chainId}) {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const generations = Object.values(state.generations);
	let pokemonData = pokemon;
	let debutGeneration = speciesInfo.generation.name;
	if (!pokemon.is_default) {
		if (!pokemon.formData.is_battle_only) {
			debutGeneration = generations.find(generation => generation.version_groups.some(version => version.name === pokemon.formData.version_group.name)).name;
		} else {
			// we should use the default form's data, the default-form-pokemon's data was already cached when dealing with evolution chain.
			pokemonData = state.pokemons[getIdFromURL(pokemon.species.url)];
		};
	};
	
	const generationNames = generations.map(generation => generation.name);
	const generationOptions = generationNames.slice(generationNames.indexOf(debutGeneration));

	const [selectedGeneration, setSelectedGeneration] = useState(debutGeneration);

	const versionGroups = state.generations[transformKeyName(selectedGeneration)].version_groups;
	const [selectedVersion, setSelectedVersion] = useState(versionGroups[0].name);
	
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
				}
			});
		};
		findHeighestEvoLevel(chainDetails);
	};

	const filterMoves = (method, version) => {
		return pokemonData.moves.filter(move => move.version_group_details
			.some(detail => detail.version_group.name === version && detail.move_learn_method.name === method))
			.map(move => ({...move, version_group_details: move.version_group_details.filter(detail => detail.version_group.name === version && detail.move_learn_method.name === method)}));
	};
	const filteredMoves = filterMoves('level-up', selectedVersion);

	console.log(filteredMoves);

	const cachedMoves = filteredMoves.reduce((pre, cur) => {
		const moveName = transformKeyName(cur.move.name);
		pre[moveName] = state.moves[moveName];
		return pre;
	}, {});

	const isDataReady = Object.values(cachedMoves).every(Boolean);

	let movesData;

	const movesDataCreator = moves => {
		const data = moves.map(entry => {
			const lookupName = transformKeyName(entry.move.name);
			const cachedMove = state.moves[lookupName];
			const versionDetail = entry.version_group_details;
			// value attribute is used for sorting, if maxEvoLevel is 0, put it after level 1.
			const learnOnEvolution = <span data-tag="allowRowEvents" value={maxEvoLevel === 0 ? 2 : maxEvoLevel} title="Learned when Evolution" className="learnUponEvolution">Evo.</span>;
			const type = <span data-tag="allowRowEvents" className={`type type-${cachedMove.type.name}`}>{cachedMove.type.name.toUpperCase()}</span>

			const checkLearnOnEvo = level => {
				return level === 0 ? learnOnEvolution : level;
			};

			return {
				level: versionDetail.length === 1 ? checkLearnOnEvo(versionDetail[0].level_learned_at) : versionDetail.map(detail => checkLearnOnEvo(detail.level_learned_at)),
				move: entry.move.name,
				type: type,
				cat: cachedMove.damage_class.name,
				power: cachedMove.power !== null ? cachedMove.power : '—',
				acc: cachedMove.accuracy !== null ? `${cachedMove.accuracy}%` : '—',
				pp: cachedMove.pp,
				effect: cachedMove.effect_entries,
				flavorText: cachedMove.flavor_text_entries
			};
		});

		data.forEach((move, index) => {
			// moves that learned at differetn levels of the a pokemon
			if (move.level instanceof Array) {
				move.level.forEach(level => {
					data.push({...move, level: level})
				})
				delete data[index];
			};
		});

		// if the pokemon learn move on evolution, put this move at where it should be, which is the minimum level we can get this pokemon.
		return data.flat().sort((a, b) => {
			const levelA = typeof a.level === 'object' ? a.level.props.value : a.level;
			const levelB = typeof b.level === 'object' ? b.level.props.value : b.level;
			return levelA - levelB;
		});
	};

	// if the data is already cached, use that, else fetch what's missing
	if (isDataReady) {
		movesData = movesDataCreator(filteredMoves);
	};

	useEffect(() => {
		if (!isDataReady) {
			const getMoves = async () => {
				const movesToFetch = filteredMoves.filter(entry => !cachedMoves[transformKeyName(entry.move.name)])
					.map(entry => entry.move.url);

				const dataResponses = await Promise.all(movesToFetch.map(move => fetch(move)));
				const datas = dataResponses.map(response => response.json());
				const finalData = await Promise.all(datas);
				dispatch({type: 'movesLoaded', payload: finalData.reduce((pre, cur) => {
					pre[transformKeyName(cur.name)] = cur;
					return pre;
				}, {})});
			}
			getMoves();
		}
	}, [cachedMoves, dispatch, filteredMoves, isDataReady]);

	// see if remove tabs that don't show?
	// gen 8 doesn't support pokemons transfer?
	// memoize cachedMoves

	// do i use reduce function a lot, may create a util?
		
	// active btn, disable btn, disable text input in Pokemons.
	
	// change moves to TM...
	// find a way to chache moves when version changes

	const handleClick = generation => {
		setSelectedGeneration(generation);
		const versionGroups = state.generations[transformKeyName(generation)].version_groups;
		setSelectedVersion(versionGroups[0].name);
	};

	return (
		<div className="moves text-center mt-5">
			<h1>Moves</h1>
			<div>{generationOptions.map(generation => (
				<button 
					className={`generationBtn btn btn-outline-secondary m-1 ${selectedGeneration === generation ? 'active' : ''}`} 
					key={generation}
					onClick={() => handleClick(generation)}
				>{(generation.replace('generation-', '')).toUpperCase()}</button>
			))}</div>
			<div className='col-12 varieties'>
				<ul>
					{versionGroups.map(version => (
						<React.Fragment key={version.name}>
							<li className={version.name === selectedVersion ? 'selected' : ''}>
								<button className='text-capitalize' onClick={() => setSelectedVersion(version.name)}>{version.name}</button>
							</li>
						</React.Fragment>
					))}
					
				</ul>
			</div>
			{
				movesData ? (
					<DataTable
						columns={columns}
						data={movesData}
						highlightOnHover
						expandableRows
						expandOnRowClicked
						expandableRowsHideExpander
						expandableRowsComponent={MoveEffect}
						expandableRowsComponentProps={{selectedVersion}}
					/>
				) : <Spinner />
			}
		</div>
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
			{data.level.type === 'span' && (
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