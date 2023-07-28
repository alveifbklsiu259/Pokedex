import { memo } from "react"
import { useDispatch } from "react-redux";
import { advancedSearchReset } from "../features/pokemonData/pokemonDataSlice";
import FilterGeneration from "./FilterGeneration";
import FilterTypes from "./FilterTypes";

const AdvancedSearch = memo(function AdvancedSearch({
	searchParam,
	setSearchParam,
	selectedTypes,
	setSelectedTypes,
	selectedGenerations,
	setSelectedGenerations,
	setMatchMethod,
	collapseId
}) {
	const dispatch = useDispatch();
	const handleReset = () => {
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
					onClick={handleReset}
					type="button"
					className="btn btn-md resetBtn bg-danger"
				>Reset
				</button>
			</div>
		</div>
	)
});

export default AdvancedSearch