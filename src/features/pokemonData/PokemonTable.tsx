import { useMemo, useEffect, useCallback } from "react";
import { shallowEqual } from "react-redux";
import DataTable, { type TableColumn, type SortOrder } from "react-data-table-component"
import { selectPokemons, selectSpecies, selectTypes, selectStat, selectAllIdsAndNames } from "./pokemonDataSlice";
import { selectTableInfo, selectIntersection, selectLanguage, selectStatus, selectSortBy, tableInfoChanged, sortByChange, sortPokemons, SortOption } from "../display/displaySlice";
import { useNavigateToPokemon, getPokemons } from "../../api"
import Spinner from "../../components/Spinner";
import { getNameByLanguage, transformToKeyName } from "../../util";
import { capitalize } from "@mui/material";
import { TableInfoRefTypes } from "./Pokemons";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

const scrollToTop = () => {
	const viewModeElement = document.querySelector('.viewMode')!;
	(viewModeElement.nextSibling as HTMLDivElement).scrollTo({
		top: 0,
		left: 0,
		behavior: "smooth",
	});
};

const prowsPerPageOptions=[10, 30, 50, 100];

type Stats = {
	"attack": number,
	"defense": number,
	"hp": number,
	"special-attack": number,
	"special-defense": number,
	"speed": number
}

type PokemonTableProps = {
	tableInfoRef: React.MutableRefObject<TableInfoRefTypes>
}

export default function PokemonTable({tableInfoRef}: PokemonTableProps) {
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

		const idData = (
			// data-value is for sorting
			<div data-value={id} className={`idData idData-${id}`}>
				<div data-tag="allowRowEvents">{String(id).padStart(4, '0')}</div>
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
		const totalData = <span data-tag="allowRowEvents" data-value={total} className="totalData">{total}</span>

		// other workaround to handle type for stats?
		const stats = pokemon.stats.reduce<Partial<Stats>>((pre, cur) => {
			pre[cur.stat.name as keyof Stats] = cur.base_stat;
			return pre;
		}, {}) as Stats;

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

	type ColData = (typeof pokemonTableData)[number]

	const columnData: TableColumn<ColData>[] = useMemo(() => Object.keys(pokemonTableData[0] || []).map((data) => {
		const formatTableHeader = (data: keyof ColData) => {
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

		const sortElement = (data: 'number' | 'total') => (rowA: ColData, rowB: ColData) => {
			const a: number = rowA[data].props['data-value'];
			const b: number = rowB[data].props['data-value'];
			return a - b
		};

		return {
			id: data,
			name: formatTableHeader(data as keyof ColData),
			// the declaration file of rdt specifies that the return type of "selector" can only be Primitive, but in my use case, I want to show React.JSX.Element in some of the field.
			selector: row => (row[data as keyof ColData] as any),
			sortable: data === 'type' ? false : true,
			center: true,
			sortFunction: data === 'number' || data === 'total' ? sortElement(data) : undefined
		};
	}), [pokemonTableData, language, stats]);

	const handleRowClick = useCallback(async (row: ColData) => {
		const pokemonId: number = row.number.props['data-value'];
		const nextSortBy = tableInfoRef.current.sortBy;  // should not be undefined
		if (nextSortBy) {
			// this is basically the same as dispatch(sortPokemons(...)), but if we just do that, it'll cause multiple re-renders(both sortPokemons and getRequiredDataThunk(thunk dispatched in navigateToPokemon) have state updates in both pending and fulfilled reducer functions), and since there's no fetching needed when sorting pokemons, we can manually make these dispatches batched together(even with tableInfoChanged and the getRequiredDataThunk's pending reducer function).
			const {fetchedPokemons, nextRequest, pokemonsToDisplay} = await getPokemons(pokemons, allPokemonNamesAndIds, dispatch, intersection, nextSortBy);
			dispatch(sortByChange(nextSortBy));
			dispatch(sortPokemons.fulfilled({fetchedPokemons, nextRequest, pokemonsToDisplay}));
		};
		// this doesn't need to be stored in tableInfo anymore.
		// delete tableInfoRef.current.sortBy;

		dispatch(tableInfoChanged({...tableInfoRef.current, selectedPokemonId: pokemonId}));
		navigateToPokemon([pokemonId], ['evolutionChain', 'ability', 'item']);
	}, [tableInfoRef, pokemons, allPokemonNamesAndIds, dispatch, intersection, navigateToPokemon]);

	const handleChangePage = useCallback((page: number) => {
		tableInfoRef.current.page = page;
		scrollToTop();
	}, [tableInfoRef]);

	const handleChangeRowsPerPage = useCallback((currentRowsPerPage: number, currentPage: number) => {
		tableInfoRef.current.rowsPerPage = currentRowsPerPage;
		tableInfoRef.current.page = currentPage;
	}, [tableInfoRef]);

	const handleSort = useCallback((selectedColumn: TableColumn<ColData>, sortDirection: SortOrder) => {
		const sortBy = (selectedColumn.id as string).concat(sortDirection.replace(sortDirection[0], sortDirection[0].toUpperCase())) as SortOption;
		tableInfoRef.current.sortBy = sortBy;
		scrollToTop();
	}, [tableInfoRef]);

	useEffect(() => {
		if (tableInfo.selectedPokemonId) {
			// mimic scroll restoration when come back to /.
			setTimeout(() => (document.querySelector(`.idData-${tableInfo.selectedPokemonId}`) as HTMLDivElement).scrollIntoView({
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