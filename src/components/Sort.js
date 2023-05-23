import { usePokemonData } from "./PokemonsProvider"
import { getPokemons } from "../api";

export default function Sort() {
	const {state, dispatch} = usePokemonData();
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
console.log(state)
	const handleSortByChanged = async sortOption => {
		dispatch({type: 'sortByChanged', payload: sortOption});
		getPokemons(dispatch, state, state.intersection, sortOption, false);
	}
	return (
		<>
			<div className="sort dropdown text-end mb-4">
				<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
					Sort By {dropdownOptions.filter(option => option.value === state.sortBy)[0].text}
				</button>
				<ul className="dropdown-menu dropdown-menu-dark">
					{dropdownOptions.map(option => (
						<li key={option.value} onClick={() => handleSortByChanged(option.value)} className={`dropdown-item ${state.sortBy === option.value ? 'active' : ''}`} >{option.text}</li>
					))}
				</ul>
			</div>
		</>
	)
}