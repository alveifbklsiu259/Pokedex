import { memo } from "react"
import { useDispatch } from "react-redux";
import { advancedSearchReset, type SelectedTypes, type SelectedGenerations } from "./searchSlice";
import FilterGeneration from "./FilterGeneration";
import FilterTypes from "./FilterTypes";


// do we really have to re declare the type here even though we just did it in the Seach component?
type AdvancedSearchProps = {
	setSearchParam: React.Dispatch<React.SetStateAction<string>>,
	selectedTypes: SelectedTypes,
	setSelectedTypes: React.Dispatch<React.SetStateAction<SelectedTypes>>,
	selectedGenerations: SelectedGenerations,
	setSelectedGenerations: React.Dispatch<React.SetStateAction<SelectedGenerations>>,
	setMatchMethod: React.Dispatch<React.SetStateAction<"all" | "part">>
	collapseId: string
}

const AdvancedSearch = memo<AdvancedSearchProps>(function AdvancedSearch({
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
		// if no state update needed, return the same state to prevent re-render.
		setSelectedTypes(st => !st.length ? st : []);
		setSelectedGenerations(sg => !Object.keys(sg).length ? sg : {});
		setSearchParam('');
		dispatch(advancedSearchReset());
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
export default AdvancedSearch;