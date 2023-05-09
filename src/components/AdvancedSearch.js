import { useRef } from "react"
import FilterGeneration from "./FilterGeneration";
import FilterTypes from "./FilterTypes";
import { usePokemonData } from "./PokemonsProvider";

export default function AdvancedSearch({types, generations, param}) {
	const { dispatch } = usePokemonData();
	const ref = useRef(null);
	const changeIcon = () => {
		if (ref.current.closest('button').getAttribute('aria-expanded') === 'true') {
			ref.current.classList.remove('fa-caret-down');
			ref.current.classList.add('fa-caret-up');
		} else {
			ref.current.classList.remove('fa-caret-up');
			ref.current.classList.add('fa-caret-down');
		};
	}

	const handleReset = () => {
		const {setSelectedTypes} = types;
		const {setSelectedGenerations} = generations;
		const {setSearchParam} = param
		setSelectedTypes([]);
		setSelectedGenerations({});
		setSearchParam('')
		dispatch({type: 'advancedSearchReset'});
	}

	return (
		<div className="advancedSearch text-center mt-3">
			<button type="button" data-bs-toggle="collapse" data-bs-target="#advanced_search" aria-expanded="false" aria-controls="advanced_search" onClick={changeIcon}>
				Show Advanced Search <i ref={ref} className="fa-solid fa-caret-down"></i>
			</button>
			<div className="collapse" id="advanced_search">
				<div className="container m-0 row justify-content-center">
					<FilterGeneration generations={generations} />
					<FilterTypes types={types} />
					<button onClick={handleReset} type="button" className="btn btn-secondary btn-md w-25 bg-secondary ">Reset</button>
					{/* region //https://pokeapi.co/api/v2/region */}
				</div>
			</div>
		</div>
	)
}