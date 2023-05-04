import { useRef } from "react"
import FilterGeneration from "./FilterGeneration";
import FilterTypes from "./FilterTypes";

export default function AdvancedSearch() {
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

	return (
		<div className="advancedSearch text-center mt-3">
			<button type="button" data-bs-toggle="collapse" data-bs-target="#advanced_search" aria-expanded="false" aria-controls="advanced_search" onClick={changeIcon}>
				Show Advanced Search <i ref={ref} className="fa-solid fa-caret-down"></i>
			</button>
			<div className="collapse" id="advanced_search">
				<div className="container m-0 row justify-content-center">
					<FilterGeneration />
					<FilterTypes />
							{/* reset button */}
							{/* region //https://pokeapi.co/api/v2/region */}
				</div>
			</div>
		</div>
	)
}