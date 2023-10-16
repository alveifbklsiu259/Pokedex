import { memo } from 'react'
import { selectSortBy, tableInfoChanged, sortPokemons } from './displaySlice';
import { useAppDispatch, useAppSelector } from '../../app/hooks';

export const sortOptions = [
	{text:'Number(low - high)', value: 'numberAsc'},
	{text:'Number(high - low)', value: 'numberDesc'},
	{text:'Name(A - Z)', value: 'nameAsc'},
	{text:'Name(Z - A)', value: 'nameDesc'},
	{text:'Height(short - tall)', value: 'heightAsc'},
	{text:'Height(tall - short)', value: 'heightDesc'},
	{text:'Weight(light - heavy)', value: 'weightAsc'},
	{text:'Weight(heavy - light)', value: 'weightDesc'},
	{text:'Total-Stats(heigh - low)', value: 'totalDesc'},
	{text:'Total-Stats(low - heigh)', value: 'totalAsc'},
	{text:'Attack(heigh - low)', value: 'attackDesc'},
	{text:'Attack(low - heigh)', value: 'attackAsc'},
	{text:'HP(heigh - low)', value: 'hpDesc'},
	{text:'HP(low - heigh)', value: 'hpAsc'},
	{text:'Defense(heigh - low)', value: 'defenseDesc'},
	{text:'Defense(low - heigh)', value: 'defenseAsc'},
	{text:'Special-Attack(heigh - low)', value: 'special-attackDesc'},
	{text:'Special-Attack(low - heigh)', value: 'special-attackAsc'},
	{text:'Special-Defense(heigh - low)', value: 'special-defenseDesc'},
	{text:'Special-Defense(low - heigh)', value: 'special-defenseAsc'},
	{text:'Speed(heigh - low)', value: 'speedDesc'},
	{text:'Speed(low - heigh)', value: 'speedAsc'},
] as const;

const Sort = memo(function Sort() {
	const sortBy = useAppSelector(selectSortBy);
	const dispatch = useAppDispatch();

	const handleClick = async (sortOption: typeof sortBy) => {
		if (sortOption !== sortBy) {
			dispatch(sortPokemons(sortOption));
		};
		// reset table info
		dispatch(tableInfoChanged({
			page: 1,
			selectedPokemonId: null
		}));
	};
	return (
		<>
			<div className="sort dropdown dropdown-center text-end mb-4">
				<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
					Sort By {sortOptions.filter(option => option.value === sortBy)[0].text}
				</button>
				<ul className="dropdown-menu dropdown-menu-dark ">
					{sortOptions.map(option => (
						<li 
							key={option.value} 
							onClick={() => handleClick(option.value)}
							className={`dropdown-item ${sortBy === option.value ? 'active' : ''}`}
						>
							<button className="w-100">{option.text}</button>
						</li>
					))}
				</ul>
			</div>
		</>
	)
});
export default Sort;