import { memo, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import DataTable from "react-data-table-component"
import { Switch, Stack, Typography, capitalize } from "@mui/material"
import { selectLanguage } from "../features/pokemonData/pokemonDataSlice";
import Spinner from "./Spinner";
import { getTextByLanguage } from "../util";

const getMoveIds = movesData => JSON.stringify(Object.values(movesData).map(move => move.id));

const MoveEffect = ({data, previousSelectedVersion}) => {
	const language = useSelector(selectLanguage);
	const effect = getTextByLanguage(language, data.effect, 'effect', previousSelectedVersion);
	const flavorText = getTextByLanguage(language, data.flavorText, 'flavor_text', previousSelectedVersion);
	return (
		<div className="moveDes">
			{data?.level?.type === 'span' && (
				<ul className="evo">
					Evo.
					<li>{data.level.props.title}</li>
				</ul>
			)}
			<ul className="effect">
				Effect
				<li>{effect}</li>
			</ul>
			<ul className="description">
				Description
				<li>{flavorText}</li>
			</ul>
		</div>
	)
};

const FilterButton = memo(function FilterButton({isDataReady, changefilteredMethod}) {
	return (
		<Stack direction="row" spacing={1} alignItems="center">
			<Typography>Level</Typography>
				<Switch disabled={!isDataReady} onChange={changefilteredMethod}/>
			<Typography>Machine</Typography>
		</Stack>
	)
});

export default function MovesTable({columnData, movesData, selectedVersion, changefilteredMethod, filteredMethod, isDataReady}) {
	const [previousData, setPreviousData] = useState(movesData);
	const [previousSelectedVersion, setPreviousSelectedVersion] = useState(selectedVersion);

	const cachedSpinner = useMemo(() => <Spinner/>, []);
	const cachedFilterButton = useMemo(() => <FilterButton isDataReady={isDataReady} changefilteredMethod={changefilteredMethod} />, [isDataReady, changefilteredMethod]);

	const expandableRowsComponentProps= useMemo(()=> ({previousSelectedVersion}), [previousSelectedVersion]);

	// if the current data is the same as the old one, use the old one to prevent re-render. (caching movesData would probably not work for this since selectedGeneration/selectedVersion changes so often), also use the old selected version(selected verion is only used for move descriptions which don't change often even between different generation).
	if (getMoveIds(previousData) !== getMoveIds(movesData)) {
		setPreviousData(movesData);
		setPreviousSelectedVersion(selectedVersion);
		return;
	};

	// by the time MovesTable renders(Moves re-render), we're passing down the old column data (really?) notice that those columns do not re-render(because I cached them)
	// then the next re-render the column updates or I should say that it's caused by column change, so the re-render happen

	// confusion:
	// 1. why the log in MovesTable being logged to the console twice even though it only re-render once?
	// A: seems like it's caused by setPreviousData()

	// 2. when I log the columnData, it shows the newest value
	// A: even I don't cache columnData, the first time it's passed, it will be cached?

	return (
		<DataTable
			columns={columnData}
			data={previousData}
			highlightOnHover
			expandableRows
			expandOnRowClicked
			expandableRowsHideExpander
			expandableRowsComponent={MoveEffect}
			expandableRowsComponentProps={expandableRowsComponentProps}
			title={`Moves Learn by ${capitalize(filteredMethod)}`}
			subHeader
			subHeaderComponent={cachedFilterButton}
			progressPending={!isDataReady}
			progressComponent={cachedSpinner}
		/>
	)
};