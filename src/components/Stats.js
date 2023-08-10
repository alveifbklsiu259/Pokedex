import { memo } from "react";
import { useSelector } from "react-redux";
import { selectLanguage, selectStat, selectPokemonById } from "../features/pokemonData/pokemonDataSlice";
import { getNameByLanguage, transformToKeyName } from "../util";

const Stats = memo(function Stats({pokeId}) {
	const pokemon = useSelector(state => selectPokemonById(state, pokeId));
	const stat = useSelector(selectStat);
	const language = useSelector(selectLanguage);
	return (
		<div className="col-12 mt-5 stats">
			<h1 className="text-center" >Stats</h1>
			<table className="mx-auto">
				<tbody>
					{
						pokemon.stats.map(entry => (
							<tr key={entry.stat.name}>
								<td className='text-capitalize text-center' width='30%'>
									{getNameByLanguage(entry.stat.name, language, stat[transformToKeyName(entry.stat.name)])}
								</td>
								<td width='10%'>{entry.base_stat}</td>
								<td width='255px'>
									<div className="stat-bar-bg">
										<div className={`stat-bar stat-${entry.stat.name}`} style={{width: `${entry.base_stat / 255 * 100}%`}}></div>
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