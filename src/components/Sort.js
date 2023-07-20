import { getPokemons } from "../api";
import { useSelector, useDispatch } from "react-redux";
import { selectPokemons, selectAllIdsAndNames, selectSortBy, selectIntersection , selectStatus } from "../features/pokemonData/pokemonDataSlice";

const dropdownOptions = [
	{text:'Number(low - high)', value: 'numberAsc'},
	{text:'Number(high - low)', value: 'numberDesc'},
	{text:'Name(A - Z)', value: 'nameAsc'},
	{text:'Name(Z - A)', value: 'nameDesc'},
	{text:'Height(short - tall)', value: 'heightAsc'},
	{text:'Height(tall - short)', value: 'heightDesc'},
	{text:'Weight(light - heavy)', value: 'weightAsc'},
	{text:'Weight(heavy - light)', value: 'weightDesc'}
];

export default function Sort() {
	const pokemons = useSelector(selectPokemons)
	const allPokemonNamesAndIds = useSelector(selectAllIdsAndNames)
	const sortBy = useSelector(selectSortBy)
	const intersection = useSelector(selectIntersection)
	const status = useSelector(selectStatus)
	const dispatch = useDispatch();

	const handleClick = async sortOption => {
		if (sortOption !== sortBy) {
			dispatch({type: 'sortByChanged', payload: sortOption});
			getPokemons(dispatch, pokemons, allPokemonNamesAndIds, intersection, sortOption, status);
		};
	};
	return (
		<>
			<div className="sort dropdown text-end mb-4">
				<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
					Sort By {dropdownOptions.filter(option => option.value === sortBy)[0].text}
				</button>
				<ul className="dropdown-menu dropdown-menu-dark">
					{dropdownOptions.map(option => (
						<li 
							key={option.value} 
							onClick={() => handleClick(option.value)} 
							className={`dropdown-item ${sortBy === option.value ? 'active' : ''}`}
						>
							<button className="w-100" disabled={status === 'loading' ? true : false}>{option.text}</button>
						</li>
					))}
				</ul>
			</div>
		</>
	)
}