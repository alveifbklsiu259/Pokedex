import { useMemo } from "react";
import DataTable from "react-data-table-component"
import { useNavigateToPokemon } from "./PokemonsProvider"
import Spinner from "./Spinner";
import { getNameByLanguage, transformToKeyName } from "../util";
import { capitalize } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { selectPokeData } from "../features/pokemonData/pokemonDataSlice";

export default function PokemonTable() {
	const state = useSelector(selectPokeData);
	const dispatch = useDispatch();
	const navigateToPokemon = useNavigateToPokemon();

	const pokemonTableData = useMemo(() => [...state.intersection].sort((a,b)=> a - b).map(id => {
		const species = state.pokemonSpecies[id];
		const pokemon = state.pokemons[id];
		const pokemonName = getNameByLanguage(species.name, state.language, species);

		const idData = (
			// value is for sorting
			<div value={id} className={`idData idData-${id}`}>
				<div data-tag="allowRowEvents">{String(id).padStart(4, 0)}</div>
				<img width='96px' height='96px' data-tag="allowRowEvents" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${[id]}.png`} alt={pokemonName} className="id"/>
			</div>
		);
		
		const typeData = (
			<div className="typeData">{
				pokemon.types.map(entry => (
					<span
						data-tag="allowRowEvents"
						key={entry.type.name} 
						className={`type-${entry.type.name} type`}
					>
						{getNameByLanguage(entry.type.name, state.language, state.types[entry.type.name])}
					</span>
				))
			}</div>
		)
		
		const total = pokemon.stats.reduce((accumulator, currentVal) => accumulator + currentVal.base_stat, 0);
		const totalData = <span data-tag="allowRowEvents" value={total} className="totalData">{total}</span>

		const stats = pokemon.stats.reduce((pre, cur) => {
			pre[cur.stat.name] = cur.base_stat;
			return pre;
		}, {});

		const basicInfo = {
			number: idData,
			name: capitalize(pokemonName),
			type: typeData,
			height: pokemon.height * 10,
			weight: pokemon.weight * 100 / 1000,
			total: totalData
		};
		return {...basicInfo, ...stats}
	}), [state.intersection, state.language, state.pokemonSpecies, state.pokemons, state.types]);

	const columnData = useMemo(() => Object.keys(pokemonTableData[0]).map(data => {
		const formatTableHeader = data => {
			const columnHeader = getNameByLanguage(data, state.language, state.stat[transformToKeyName(data)]);
			switch (columnHeader) {
				case 'hp' : 
					return 'HP'
				case 'special-attack' : 
					return 'Sp.Atk'
				case 'special-defense' :
					return 'Sp.Def'
				case 'number' :
					return '#'
				case 'height' :
					return `${capitalize(columnHeader)} (cm)`
				case 'weight' :
					return `${capitalize(columnHeader)} (kg)`
				default : 
					return capitalize(columnHeader)
			};
		};

		const sortElement = data => (rowA, rowB) => {
			const a = rowA[data].props.value;
			const b = rowB[data].props.value;
			return String(a).localeCompare(String(b), undefined, {numeric: true});
		};

		return {
			id: data,
			name: formatTableHeader(data),
			selector: row => row[data],
			sortable: data === 'type' ? false : true,
			center: true,
			sortFunction: data === 'number' || data === 'total' ? sortElement(data) : null,
		};
	}), [pokemonTableData, state.language, state.stat]);


// 	setTimeout(() =>document.querySelector('.idData-546').scrollIntoView({
// 		behavior: 'smooth',
// 		block: 'nearest',
// 		inline: 'nearest'
//    }), 100)


	// scroll to top
	// scroll restoration

	return (
		<DataTable
			columns={columnData}
			data={pokemonTableData}
			highlightOnHover
			progressPending={state.status === 'loading'}
			progressComponent={<Spinner />}
			pointerOnHover
			onRowClicked={row => navigateToPokemon(state, dispatch, [row.number.props.value], [ 'evolutionChains', 'abilities', 'items'])}
			pagination
			// when sorting there seems to be no way to memoize each row(there's no memo wrapped around rdt_TableRow) or each cell(there's memo, but the prop "rowIndex" will change), so I think the only thing I can do is limit the number of rows shown per page.
			paginationPerPage={10}
			paginationRowsPerPageOptions={[10, 30, 50, 100]}
			fixedHeader
			fixedHeaderScrollHeight="70vh"
			// paginationDefaultPage={Number(sessionStorage.getItem('pokemonTablePage')) || 1}
			onChangePage={page => {
				// sessionStorage.setItem('pokemonTablePage', page);
				document.querySelector('.viewMode').nextSibling.scrollTo({
					top: 0,
					left: 0,
					behavior: "smooth",
				});
			}}
		/>
	)
};


// no fixedHeader, 

// sorting an array of components, should they re-renders?
// check optimization
// https://react-data-table-component.netlify.app/?path=/docs/performance-optimization--page

// add show non-default-form checkbox,
// show mythical pokemons,
// show legendary pokemons