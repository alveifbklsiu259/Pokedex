import DataTable from "react-data-table-component"
import { Switch, Stack, Typography, capitalize } from "@mui/material"
import Spinner from "./Spinner";
import { usePokemonData } from "./PokemonsProvider";
import { getTextByLanguage } from "../util";

const MoveEffect = ({data, selectedVersion}) => {
	const state = usePokemonData();
	const language = state.language;
	const effect = getTextByLanguage(language, data.effect, 'effect', selectedVersion);
	const flavorText = getTextByLanguage(language, data.flavorText, 'flavor_text', selectedVersion);
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
}


export default function MovesTable({columnData, movesData, selectedVersion, changefilteredMethod, filteredMethod, isDataReady}) {

	return (
		<DataTable
			columns={columnData}
			data={movesData}
			highlightOnHover
			expandableRows
			expandOnRowClicked
			expandableRowsHideExpander
			expandableRowsComponent={MoveEffect}
			expandableRowsComponentProps={{selectedVersion}}
			title={`Moves Learn by ${capitalize(filteredMethod)}`}
			subHeader
			subHeaderComponent={(
				<Stack direction="row" spacing={1} alignItems="center">
					<Typography>Level</Typography>
						<Switch disabled={!isDataReady} onChange={changefilteredMethod}/>
					<Typography>Machine</Typography>
				</Stack>
			)}
			progressPending={!isDataReady}
			progressComponent={<Spinner />}
		/>
	)
};