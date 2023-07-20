import { useRef, memo, useId } from "react"
import FilterGeneration from "./FilterGeneration";
import FilterTypes from "./FilterTypes";
import { advancedSearchReset } from "../features/pokemonData/pokemonDataSlice";
import { useDispatch } from "react-redux";

const AdvancedSearch = memo(function AdvancedSearch({
	searchParam,
	setSearchParam,
	selectedTypes,
	setSelectedTypes,
	selectedGenerations,
	setSelectedGenerations,
	setMatchMethod,
}) {

	const ref = useRef(null);
	const collapseId = useId();
	const dispatch = useDispatch();
	const changeIcon = () => {
		if (ref.current.closest('button').getAttribute('aria-expanded') === 'true') {
			ref.current.classList.remove('fa-caret-down');
			ref.current.classList.add('fa-caret-up');
		} else {
			ref.current.classList.remove('fa-caret-up');
			ref.current.classList.add('fa-caret-down');
		};
	}

	const reset = () => {
		if (selectedTypes.length) {
			setSelectedTypes([]);
		};
		if (Object.keys(selectedGenerations).length) {
			setSelectedGenerations({});
		}
		if (searchParam !== '') {
			setSearchParam('');
		};
		if (selectedTypes.length || Object.keys(selectedGenerations).length || searchParam !== '') {
			dispatch(advancedSearchReset());
		};
	};
	return (
		<div className="advancedSearch text-center mt-3">
			<button type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded="false" aria-controls={collapseId} onClick={changeIcon}>
				Show Advanced Search <i ref={ref} className="fa-solid fa-caret-down"></i>
			</button>
			<div className="collapse" id={collapseId}>
				<div className="container m-0 row justify-content-center">
					<FilterGeneration 
						selectedGenerations={selectedGenerations} 
						setSelectedGenerations={setSelectedGenerations}
					/>
					<FilterTypes 
						selectedTypes={selectedTypes} 
						setSelectedTypes={setSelectedTypes}
						setMatchMethod={setMatchMethod}
					/>
					<button 
						onClick={reset} 
						type="button" 
						className="btn btn-md resetBtn bg-danger"
					>Reset
					</button>
				</div>
			</div>
		</div>
	)
});

export default AdvancedSearch