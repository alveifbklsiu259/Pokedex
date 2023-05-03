import { usePokemonData } from "./PokemonsProvider"

export default function Filter() {
	const dropdownOptions = [
		{text:'Number(low - high)' , value: 'numberAsc'},
		{text:'Number(high - low)' , value: 'numberDesc'},
		{text:'Name(A - Z)' , value: 'nameAsc'},
		{text:'Name(Z - A)' , value: 'nameDesc'},
		{text:'Height(short - tall)' , value: 'heightAsc'},
		{text:'Height(tall - short)' , value: 'heightDesc'},
		{text:'Weight(light - heavy)' , value: 'weightAsc'},
		{text:'Weight(heavy - light)' , value: 'weightDesc'}
	];
	const {state, dispatch} = usePokemonData();

	return (
		<>
			<div className="filter dropdown text-end mb-4">
				<button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
					Sort By {dropdownOptions.filter(option => option.value === state.sortBy)[0].text}
				</button>
				<ul className="dropdown-menu dropdown-menu-dark">
					{dropdownOptions.map(option => (
						<li key={option.value} onClick={() => dispatch({type: option.value})} className={`dropdown-item ${state.sortBy === option.value ? 'active' : ''}`} >{option.text}</li>
					))}
				</ul>
			</div>
		</>
	)
}