import { memo } from "react";
import { selectLanguage } from "../display/displaySlice";
import { selectStat, selectPokemonById } from "./pokemonDataSlice";
import { getNameByLanguage, transformToKeyName } from "../../util";
import { useAppSelector } from "../../app/hooks";

type StatsProps = {
	pokeId: string
}

const Stats = memo<StatsProps>(function Stats({pokeId}) {
	const pokemon = useAppSelector(state => selectPokemonById(state, pokeId))!;
	const stats = useAppSelector(selectStat);
	const language = useAppSelector(selectLanguage);
	return (
		<div className="col-12 mt-5 stats">
			<h1 className="text-center" >Stats</h1>
			<table className="mx-auto">
				<tbody>
					{
						pokemon.stats.map(entry => (
							<tr key={entry.stat.name}>
								<td className='text-capitalize text-center' width='30%'>
									{getNameByLanguage(entry.stat.name, language, stats[transformToKeyName(entry.stat.name)])}
								</td>
								<td width='10%'>{entry.base_stat}</td>
								<td width='255px'>
									<div className="stat-bar-bg">
										<div style={{width: `${entry.base_stat / 255 * 100}%`}}>
											{/* key is used to retrigger animation */}
											<div key={pokeId} className={`stat-bar stat-${entry.stat.name} progressAnimation`}></div>
										</div>
									</div>
								</td>
							</tr>
						))
					}
					<tr>
						<td className="text-center" style={{fontSize: 'bold'}}>Total</td>
						<td>{pokemon.stats.reduce((accumulator, currentVal) => accumulator + currentVal.base_stat, 0)}</td>
					</tr>
				</tbody>
			</table>
		</div>
	)
});
export default Stats;