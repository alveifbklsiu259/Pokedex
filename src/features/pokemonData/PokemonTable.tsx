import { useMemo, useEffect, useCallback, useRef } from "react";
import { shallowEqual } from "react-redux";
import DataTable, { type TableColumn, type SortOrder } from "react-data-table-component";
import { selectPokemons, selectSpecies, selectTypes, selectStat, selectAllIdsAndNames } from "./pokemonDataSlice";
import { selectTableInfo, selectIntersection, selectLanguage, selectStatus, selectSortBy, tableInfoChanged, sortByChange, sortPokemons, SortOption } from "../display/displaySlice";
import { useNavigateToPokemon, getPokemons, type Stat } from "../../api";
import Spinner from "../../components/Spinner";
import { getNameByLanguage, transformToKeyName } from "../../util";
import { capitalize } from "@mui/material";
import { TableInfoRefTypes } from "./Pokemons";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

const scrollToTop = (viewModeElement: HTMLDivElement) => {
	(viewModeElement.nextSibling as HTMLDivElement).scrollTo({
		top: 0,
		left: 0,
		behavior: "smooth",
	});
};

const prowsPerPageOptions=[10, 30, 50, 100];

type Stats = Record<Exclude<Stat, 'total'>, number>;

type PokemonTableProps = {
	tableInfoRef: React.MutableRefObject<TableInfoRefTypes>,
	viewModeRef: React.RefObject<HTMLDivElement>
}

export default function PokemonTable({tableInfoRef, viewModeRef}: PokemonTableProps) {
	const dispatch = useAppDispatch();
	const navigateToPokemon = useNavigateToPokemon();
	const intersection = useAppSelector(selectIntersection, shallowEqual);
	const pokemons = useAppSelector(selectPokemons);
	const species = useAppSelector(selectSpecies);
	const language = useAppSelector(selectLanguage);
	const types = useAppSelector(selectTypes );
	const status = useAppSelector(selectStatus);
	const stats = useAppSelector(selectStat);
	const sortBy = useAppSelector(selectSortBy);
	const allPokemonNamesAndIds = useAppSelector(selectAllIdsAndNames);
	const timeoutRef = useRef(0);
	// table info
	const tableInfo = useAppSelector(selectTableInfo);
	let sortField: string, sortMethod: "asc" | 'desc';
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

		const idContent = (
			// data-value is for sorting
			<div data-value={id} className={`idData idData-${id}`}>
				<div data-tag="allowRowEvents">{String(id).padStart(4, '0')}</div>
				<img width='96px' height='96px' data-tag="allowRowEvents" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${[id]}.png`} alt={pokemonName} className="id"/>
			</div>
		);
		const typeContent = (
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
		const totalContent = <span data-tag="allowRowEvents" data-value={total} className="totalData">{total}</span>

		const stats = pokemon.stats.reduce<{[x: string]: number}>((pre, cur) => {
			pre[cur.stat.name] = cur.base_stat;
			return pre;
		}, {}) as Stats;

		const basicInfo = {
			number: idContent,
			name: capitalize(pokemonName),
			type: typeContent,
			height: pokemon.height * 10,
			weight: pokemon.weight * 100 / 1000,
			total: totalContent
		};
		return {...basicInfo, ...stats}
	}), [language, species, pokemons, types, intersection]);

	type ColData = (typeof pokemonTableData)[number];

	const formatColumnHeader = useCallback((dataKey: keyof ColData) => {
		const columnHeader = getNameByLanguage(dataKey, language, stats[transformToKeyName(dataKey)]);
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
	}, [language, stats]);

	const sortElement = useCallback((dataKey: 'number' | 'total') => (rowA: ColData, rowB: ColData) => {
		const a: number = rowA[dataKey].props['data-value'];
		const b: number = rowB[dataKey].props['data-value'];
		return a - b
	}, []);

	const columnData: TableColumn<ColData>[] = useMemo(() => Object.keys(pokemonTableData[0] || []).map(dataKey => (
		{
			id: dataKey,
			name: formatColumnHeader(dataKey as keyof ColData),
			// the declaration file of rdt specifies that the return type of "selector" can only be Primitive, but in my use case, I want to show React.JSX.Element in some of the field.
			selector: row => (row[dataKey as keyof ColData] as any),
			sortable: dataKey === 'type' ? false : true,
			center: true,
			sortFunction: dataKey === 'number' || dataKey === 'total' ? sortElement(dataKey) : undefined
		}
	)), [pokemonTableData, formatColumnHeader, sortElement]);

	const handleRowClick = useCallback(async (row: ColData) => {
		const pokemonId: number = row.number.props['data-value'];
		const nextSortBy = tableInfoRef.current.sortBy;
		if (nextSortBy) {
			// this is basically the same as dispatch(sortPokemons(...)), but if we just do that, it'll cause multiple re-renders(both sortPokemons and getRequiredDataThunk(thunk dispatched in navigateToPokemon) have state updates in both pending and fulfilled reducer functions), and since there's no fetching needed when sorting pokemons, we can manually make these dispatches batched together(even with tableInfoChanged and the getRequiredDataThunk's pending reducer function).
			const {fetchedPokemons, nextRequest, pokemonsToDisplay} = await getPokemons(pokemons, allPokemonNamesAndIds, dispatch, intersection, nextSortBy);
			dispatch(sortByChange(nextSortBy));
			dispatch(sortPokemons.fulfilled({fetchedPokemons, nextRequest, pokemonsToDisplay}, 'display/sortPokemons', nextSortBy));
		};
		dispatch(tableInfoChanged({...tableInfoRef.current, selectedPokemonId: pokemonId}));
		navigateToPokemon([pokemonId], ['evolutionChain', 'ability', 'item']);
	}, [tableInfoRef, pokemons, allPokemonNamesAndIds, dispatch, intersection, navigateToPokemon]);

	const handleChangePage = useCallback((page: number) => {
		tableInfoRef.current.page = page;
		scrollToTop(viewModeRef.current!);
	}, [tableInfoRef, viewModeRef]);

	const handleChangeRowsPerPage = useCallback((currentRowsPerPage: number, currentPage: number) => {
		tableInfoRef.current.rowsPerPage = currentRowsPerPage;
		tableInfoRef.current.page = currentPage;
	}, [tableInfoRef]);

	const handleSort = useCallback((selectedColumn: TableColumn<ColData>, sortDirection: SortOrder) => {
		const sortBy = (selectedColumn.id as string).concat(capitalize(sortDirection)) as SortOption;
		tableInfoRef.current.sortBy = sortBy;
		scrollToTop(viewModeRef.current!);
	}, [tableInfoRef, viewModeRef]);

	useEffect(() => {
		// if we navigate to pokemons/xxx through table, then search pokemon through navba and the new intersection does not include the selectedPokemonId, there's gonna be an error when PokemonTable re-renders, the reason is when navigating back to /, the old intersection is used(navigate is executed before searchPokemon thunk), so document.querySelector(`.idData-${tableInfo.selectedPokemonId}`)) will grab the original selected pokemon, therefore the timeout below will run, but then when the thunk is finished immediately, when the new intersection is used, browser can't find document.querySelector(`.idData-${tableInfo.selectedPokemonId}`)), the previoust timeout will cause an error; but this can be solved by the cleanup function.
		if (tableInfo.selectedPokemonId && document.querySelector(`.idData-${tableInfo.selectedPokemonId}`)) {
			// mimic scroll restoration when come back to /.
			timeoutRef.current = window.setTimeout(() => (document.querySelector(`.idData-${tableInfo.selectedPokemonId}`) as HTMLDivElement).scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'nearest'
			}), 400);

			return () => clearTimeout(timeoutRef.current);
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