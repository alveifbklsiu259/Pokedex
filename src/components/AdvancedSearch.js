import { useRef, memo } from "react"
import FilterGeneration from "./FilterGeneration";
import FilterTypes from "./FilterTypes";
import { usePokemonData } from "./PokemonsProvider";

const AdvancedSearch = memo(function AdvancedSearch({
	setSearchParam,
	selectedTypes,
	setSelectedTypes,
	selectedGenerations,
	setSelectedGenerations,
}) {
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
					<FilterGeneration selectedGenerations={selectedGenerations} setSelectedGenerations={setSelectedGenerations} />
					<FilterTypes selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
					<button onClick={handleReset} type="button" className="btn btn-secondary btn-md w-25 bg-secondary ">Reset</button>
				</div>
			</div>
		</div>
	)
});

export default AdvancedSearch