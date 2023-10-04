import { memo, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import DataTable from "react-data-table-component"
import { Switch, Stack, Typography, capitalize } from "@mui/material"
import { selectLanguage } from "../display/displaySlice";
import Spinner from "../../components/Spinner";
import { getTextByLanguage } from "../../util";
import type { ColData, MovesData } from "./Moves";
import type { TableColumn, ExpanderComponentProps } from "react-data-table-component";

const getMoveIds = (movesData: MovesData[]) => JSON.stringify(Object.values(movesData).map(move => move.id));

interface MoveEffectProps extends ExpanderComponentProps<MovesData> {
	// currently, props that extend ExpanderComponentProps must be set to optional.
	previousSelectedVersion?: string
}

const MoveEffect: React.FC<MoveEffectProps> = ({data, previousSelectedVersion}: MoveEffectProps) => {
	const language = useSelector(selectLanguage);

	const effect = getTextByLanguage(language, data.effect, 'effect');
	const flavorText = getTextByLanguage(language, data.flavorText, 'flavor_text', previousSelectedVersion);

	return (
		<div className="moveDes">
			{typeof data.level === 'object' && data.level.type === 'span' && (
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

type FilterButtonProps = {
	isDataReady: boolean,
	changefilteredMethod: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>,
};

const FilterButton = memo(function FilterButton({isDataReady, changefilteredMethod}: FilterButtonProps) {
	return (
		<Stack direction="row" spacing={1} alignItems="center">
			<Typography>Level</Typography>
				<Switch disabled={!isDataReady} onChange={changefilteredMethod}/>
			<Typography>Machine</Typography>
		</Stack>
	)
});

type MovesTableProps = {
	columnData: TableColumn<ColData>[],
	movesData: MovesData[],
	selectedVersion: string,
	changefilteredMethod: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>,
	filteredMethod: "machine" | "level-up",
	isDataReady: boolean
}

export default function MovesTable({columnData, movesData, selectedVersion, changefilteredMethod, filteredMethod, isDataReady}: MovesTableProps) {
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

	return (
		<DataTable
			data={previousData}
			columns={columnData}
			highlightOnHover
			expandableRows
			expandOnRowClicked
			expandableRowsHideExpander
			// @ts-ignore
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