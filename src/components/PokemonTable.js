import { useEffect } from "react";
import { getData, getDataToFetch, getRequiredData } from "../api";
import DataTable from "react-data-table-component"
import { usePokemonData, useDispatchContenxt } from "./PokemonsProvider"
import Spinner from "./Spinner";
import { getNameByLanguage } from "../util";
// const columnData = 
// const PokemonData = movesData

export default function PokemonTable() {
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();

	// const movesDataCreator = moves => {
	// 	const isFilteredByLevel = filteredMethod === 'level-up';
	// 	const data = moves.map(entry => {
	// 		const lookupName = transformToKeyName(entry.move.name);
	// 		const cachedMove = state.moves[lookupName];
	// 		const versionDetails = entry.version_group_details;

			// type
	// 		const type = cachedMove.type.name;
	// 		const typeData = <span value={type} data-tag="allowRowEvents" className={`type type-${type}`}>{getNameByLanguage(type, state.language, state.types[type]).toUpperCase()}</span>;

	// 		// level-up; value attribute is used for sorting, if maxEvoLevel is 0, put it after level 1.
	// 		const learnOnEvolution = <span data-tag="allowRowEvents" value={maxEvoLevel === 0 ? 2 : maxEvoLevel} title="Learned when Evolution" className="learnUponEvolution">Evo.</span>;
	// 		const checkLearnOnEvo = level => {
	// 			// there's some incorrect data in the API...
	// 			return !maxEvoLevel && level === 0 ? 1 : maxEvoLevel && level === 0 ? learnOnEvolution : level;
	// 		};
	// 		// some moves can be learned at different levels.
	// 		const levelData = versionDetails.length === 1 ? checkLearnOnEvo(versionDetails[0].level_learned_at) : versionDetails.map(detail => checkLearnOnEvo(detail.level_learned_at));

	// 		// category
	// 		const categoryText = getNameByLanguage(cachedMove.damage_class.name, state.language, state.move_damage_class[cachedMove.damage_class.name]);

	// 		// machine
	// 		const machine = state.machines?.[lookupName]?.version_groups?.[selectedVersion];

	// 		const machineData = (
	// 			// value is for sorting
	// 			<div value={machine} className="machineData">
	// 				<div data-tag="allowRowEvents">{machine?.toUpperCase()}</div>
	// 				<img data-tag="allowRowEvents" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tm-${type}.png`} alt={`tm-${type}`} className="machine"/>
	// 			</div>
	// 		);
	// 		const dispalyData = isFilteredByLevel ? levelData : machineData;


	// 		return {
	// 			[isFilteredByLevel ? 'level' : 'machine']: dispalyData,
	// 			move: capitalize(getNameByLanguage(entry.move.name, state.language, state.moves[transformToKeyName(entry.move.name)])),
	// 			type: typeData,
	// 			cat: categoryText,
	// 			power: cachedMove.power !== null ? cachedMove.power : '—',
	// 			acc: cachedMove.accuracy !== null ? `${cachedMove.accuracy}%` : '—',
	// 			pp: cachedMove.pp,
	// 			effect: cachedMove.effect_entries,
	// 			flavorText: cachedMove.flavor_text_entries
	// 		};
	// 	});

	// 	data.forEach((move, index) => {
	// 		// moves that learned at differetn levels
	// 		if (move.level instanceof Array) {
	// 			move.level.forEach(level => {
	// 				data.push({...move, level: level})
	// 			})
	// 			delete data[index];
	// 		};
	// 	});

	// 	// initial sort
	// 	return data.flat().sort((a, b) => {
	// 		const initialSortingEntry = isFilteredByLevel ? 'level': 'machine'
	// 		const rowA = typeof a[initialSortingEntry] === 'object' ? a[initialSortingEntry].props.value : a[initialSortingEntry];
	// 		const rowB = typeof b[initialSortingEntry] === 'object' ? b[initialSortingEntry].props.value : b[initialSortingEntry];
	// 		return isFilteredByLevel ? rowA - rowB : rowA?.localeCompare(rowB);
	// 	});
	// };

	useEffect(() => {
		if (state.status === 'idle') {
			const getAllData = async() => {
				const range = [];
				for (let i = 1; i < state.pokemonCount; i ++) {
					range.push(i);
				};
				getRequiredData(state, dispatch, range, ['pokemons', 'pokemonSpecies']);
			};
			getAllData();
		};
		
	}, [state, dispatch])

	// console.log(state)
	// ['Id', 'Name', 'Type', 'Height', 'Weight', 'Total', 'HP', 'Attack', 'Defense', 'Sp.Atk', 'Sp.Def', 'Speed'];
	const pokemonTableData = Object.values(state.pokemonSpecies).map(species => {
		const pokemonData = state.pokemons[species.id];

		const idData = (
			// value is for sorting
			<div value={species.id} className="idData">
				<div>{String(species.id).padStart(4, 0)}</div>
				<img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${[species.id]}.png`} alt={species.id} className="id"/>
			</div>
		);
		
		const typeData = (
			<div className="typeData">{
				pokemonData.types.map(entry => (
					<span 
						key={entry.type.name} 
						className={`type-${entry.type.name} type`}
					>
						{getNameByLanguage(entry.type.name, state.language, state.types[entry.type.name])}
					</span>
				))
			}</div>
		)
		const stats = pokemonData.stats.reduce((pre, cur) => {
			pre[cur.stat.name] = cur.base_stat;
			return pre;
		}, {});

		const basicInfo = {
			id: idData,
			name: getNameByLanguage(species.name, state.language, species),
			type: typeData,
			height: pokemonData.height * 10,
			weight: pokemonData.weight * 100 / 1000,
			total: pokemonData.stats.reduce((accumulator, currentVal) => accumulator + currentVal.base_stat, 0),
		};
		return {...basicInfo, ...stats}
	});

	// const columnData = Object.keys(pokemonTableData[0]).map(data => {
	// 	return {
	// 		id: data,
	// 		name: formatTableHeader(cur),
	// 		selector: row => row[data],
	// 		sortable: data === 'type' ? false : true,
	// 		center: true,
	// 		sortFunction: data === 'type' ? null : 
	// 	}
	// })




	// const columnDataCreator = movesData => {
	// 	const column = ['Id', 'Name', 'Type', 'Height', 'Weight', 'Total', 'HP', 'Attack', 'Defense', 'Sp.Atk', 'Sp.Def', 'Speed'];


	// 	const formatTableHeader = data => {
	// 		switch (data) {
	// 			case 'pp' : {
	// 				return 'PP'
	// 			}
	// 			case 'acc' :
	// 			case 'cat' :
	// 				return capitalize(data).concat('.');
	// 			default : 
	// 				return capitalize(data)
	// 		};
	// 	};

	// 	const sortNumsWithNull = data => (rowA, rowB) => {
	// 		const a = rowA[data] === '—' ? 0 : rowA[data];
	// 		const b = rowB[data] === '—' ? 0 : rowB[data];
	// 		return a - b;
	// 	};

	// 	// when switching filter method, this function will run again if we sorted data, to avoid error, use optional chaining.
	// 	const sortElement = data => (rowA, rowB) => {
	// 		const a = rowA[data]?.props?.value;
	// 		const b = rowB[data]?.props?.value;
	// 		return a?.localeCompare(b);
	// 	};

	// 	// use movesData[0] as a template.
	// 	return Object.keys(movesData[0]).reduce((pre, cur) => {
	// 		if (cur !== 'flavorText' && cur !== 'effect') {
	// 			pre.push({
	// 				id: cur,
	// 				name: formatTableHeader(cur),
	// 				selector: row => row[cur],
	// 				sortable: true,
	// 				center: true,
	// 				sortFunction: cur === 'type' || cur === 'machine' ? sortElement(cur) : cur === 'power' ? sortNumsWithNull(cur) : null
	// 			});
	// 		};
	// 		return pre;
	// 	}, []);
	// };



































	return (
		<DataTable
			// columns={columnData}
			// data={movesData}
			highlightOnHover
			progressPending={state.status}
			progressComponent={<Spinner />}
		/>
	)
};