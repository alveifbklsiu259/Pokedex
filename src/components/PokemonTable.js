import { useMemo, useEffect, useCallback } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component"
import { tableInfoChanged, selectTableInfo, selectIntersection, selectPokemons, selectSpecies, selectLanguage, selectTypes, selectStatus, selectStat, selectSortBy, sortPokemons, selectAllIdsAndNames, sortByChange } from "../features/pokemonData/pokemonDataSlice";
import { useNavigateToPokemon, getPokemons } from "../api"
import Spinner from "./Spinner";
import { getNameByLanguage, transformToKeyName } from "../util";
import { capitalize } from "@mui/material";

const scrollToTop = () => {
	document.querySelector('.viewMode').nextSibling.scrollTo({
		top: 0,
		left: 0,
		behavior: "smooth",
	});
};

const prowsPerPageOptions=[10, 30, 50, 100];

export default function PokemonTable({tableInfoRef}) {
	const dispatch = useDispatch();
	const navigateToPokemon = useNavigateToPokemon();
	const intersection = useSelector(selectIntersection, shallowEqual);
	const pokemons = useSelector(selectPokemons);
	const species = useSelector(selectSpecies);
	const language = useSelector(selectLanguage);
	const types = useSelector(selectTypes );
	const status = useSelector(selectStatus);
	const stats = useSelector(selectStat);
	const sortBy = useSelector(selectSortBy);
	const allPokemonNamesAndIds = useSelector(selectAllIdsAndNames);

	// table info
	const tableInfo = useSelector(selectTableInfo);
	let sortField, sortMethod;
	if (sortBy.includes('Asc')) {
		sortField = sortBy.slice(0, sortBy.indexOf('Asc'));
		sortMethod = 'asc';
	} else {
		sortField = sortBy.slice(0, sortBy.indexOf('Desc'));
		sortMethod = 'desc';
	};

	const pokemonTableData = useMemo(() => intersection.map(id => {
		const speciesData = species[id];
		const pokemon = pokemons[id];
		const pokemonName = getNameByLanguage(speciesData.name, language, speciesData);

		const idData = (
			// value is for sorting
			<div value={id} className={`idData idData-${id}`}>
				<div data-tag="allowRowEvents">{String(id).padStart(4, 0)}</div>
				<img width='96px' height='96px' data-tag="allowRowEvents" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${[id]}.png`} alt={pokemonName} className="id"/>
			</div>
		);
		
		const typeData = (
			<div className="typeData">
				{
					pokemon.types.map(entry => {
						const type = entry.type.name;
						return (
							<span
								data-tag="allowRowEvents"
								key={type} 
								className={`type-${type} type`}
							>
								{getNameByLanguage(type, language, types[type])}
							</span>
						)
					})
				}
			</div>
		);
		
		const total = pokemon.stats.reduce((accumulator, currentVal) => accumulator + currentVal.base_stat, 0);
		const totalData = <span data-tag="allowRowEvents" value={total} className="totalData">{total}</span>

		const stats = pokemon.stats.reduce((pre, cur) => {
			pre[cur.stat.name] = cur.base_stat;
			return pre;
		}, {});

		const basicInfo = {
			// id: pokemonName,
			number: idData,
			name: capitalize(pokemonName),
			type: typeData,
			height: pokemon.height * 10,
			weight: pokemon.weight * 100 / 1000,
			total: totalData
		};
		return {...basicInfo, ...stats}
	}), [language, species, pokemons, types, intersection]);

	const columnData = useMemo(() => Object.keys(pokemonTableData[0] || []).map(data => {
		const formatTableHeader = data => {
			const columnHeader = getNameByLanguage(data, language, stats[transformToKeyName(data)]);
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
			sortFunction: data === 'number' || data === 'total' ? sortElement(data) : null
		};
	}), [pokemonTableData, language, stats]);

	const handleRowClick = useCallback(async row => {
		const pokemonId = row.number.props.value;
		const nextSortBy = tableInfoRef.current.sortBy;
		if (nextSortBy) {
			// this is basically the same as dispatch(sortPokemons(...)), but if we just do that, it'll cause multiple re-renders(both sortPokemons and getRequiredDataThunk(thunk dispatched in navigateToPokemon) have state updates in both pending and fulfilled reducer functions), and since there's no fetching needed when sorting pokemons, we can manually make theses dispatches batched together(even with tableInfoChanged and the getRequiredDataThunk's pending reducer function).
			const {fetchedPokemons, nextRequest, pokemonsToDisplay} = await getPokemons(pokemons, allPokemonNamesAndIds, dispatch, intersection, nextSortBy);
			dispatch(sortByChange(nextSortBy));
			dispatch(sortPokemons.fulfilled({fetchedPokemons, nextRequest, pokemonsToDisplay}));
		};
		// this doesn't need to be stored in tableInfo
		delete tableInfoRef.current.sortBy;
		dispatch(tableInfoChanged({...tableInfoRef.current, selectedPokemonId: pokemonId}));
		navigateToPokemon([pokemonId], ['evolutionChains', 'abilities', 'items']);
	}, [tableInfoRef, pokemons, allPokemonNamesAndIds, dispatch, intersection, navigateToPokemon]);

	const handleChangePage = useCallback(page => {
		tableInfoRef.current.page = page;
		scrollToTop();
	}, [tableInfoRef]);
	

	const handleChangeRowsPerPage = useCallback((currentRowsPerPage, currentPage) => {
		tableInfoRef.current.rowsPerPage = currentRowsPerPage;
		tableInfoRef.current.page = currentPage;
	}, [tableInfoRef]);

	const handleSort = useCallback((selectedColumn, sortDirection) => {
		const sortBy = selectedColumn.id.concat(sortDirection.replace(sortDirection[0], sortDirection[0].toUpperCase()));
		tableInfoRef.current.sortBy = sortBy;
		scrollToTop();
	}, [tableInfoRef]);

	useEffect(() => {
		if (tableInfo.selectedPokemonId) {
			// mimic scroll restoration when come back to /.
			setTimeout(() =>document.querySelector(`.idData-${tableInfo.selectedPokemonId}`).scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'nearest'
			}), 400);
		};
	}, [tableInfo.selectedPokemonId]);

	return (
		<DataTable
			keyField='name'
			columns={columnData}
			data={pokemonTableData}
			highlightOnHover
			progressPending={status === 'loading'}
			progressComponent={<Spinner />}
			pointerOnHover
			onRowClicked={row => handleRowClick(row)}
			fixedHeader
			fixedHeaderScrollHeight="70vh"
			pagination
			// when sorting table, there seems to be no way to memoize each row(there's no memo wrapped around rdt_TableRow) or each cell(there's memo, but the prop "rowIndex" will change), so I think the only thing I can do is limit the number of rows shown per page.
			paginationPerPage={tableInfo.rowsPerPage}
			paginationRowsPerPageOptions={prowsPerPageOptions}
			paginationDefaultPage={tableInfo.page}
			onChangePage={page => handleChangePage(page)}
			onChangeRowsPerPage={(currentRowsPerPage, currentPage) => handleChangeRowsPerPage(currentRowsPerPage, currentPage)}
			onSort={(selectedColumn, sortDirection) => handleSort(selectedColumn, sortDirection)}
			defaultSortFieldId={sortField}
			defaultSortAsc={sortMethod === 'asc'}
		/>
	)
};