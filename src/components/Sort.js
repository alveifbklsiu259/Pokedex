import { memo } from 'react'
import { useSelector, useDispatch } from "react-redux";
import { selectSortBy, selectStatus, sortPokemons } from "../features/pokemonData/pokemonDataSlice";

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

const Sort = memo(function Sort() {
	const sortBy = useSelector(selectSortBy);
	const status = useSelector(selectStatus);
	const dispatch = useDispatch();

	const handleClick = async sortOption => {
		if (sortOption !== sortBy) {
			dispatch(sortPokemons(sortOption));
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
});
export default Sort;

// pokemons' navigate is not working.
// change to sort by height/weight --> change viewMode will cause an error.