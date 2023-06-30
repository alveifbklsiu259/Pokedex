import { memo } from "react";
import { getNameByLanguage, transformToKeyName } from "../util";

const Stats = memo(function Stats({pokemon, cachedLanguage, cachedStats}) {
	return (
		<div className="col-12 mt-5 stats">
			<h1 className="text-center" >Stats</h1>
			<table className="mx-auto">
				<tbody>
					{pokemon.stats ? pokemon.stats.map(entry => (
						<tr key={entry.stat.name}>
							<td className='text-capitalize text-center' width='30%'> {getNameByLanguage(entry.stat.name, cachedLanguage, cachedStats[transformToKeyName(entry.stat.name)])}</td>
							<td width='10%'>{entry.base_stat}</td>
							<td width='255px'>
								<div className="stat-bar-bg">
									<div className={`stat-bar stat-${entry.stat.name}`} style={{width: `${entry.base_stat / 255 * 100}%`}}></div>
								</div>
							</td>
						</tr>
					)) : null}
					<tr>
						<td className="text-center" style={{fontSize: 'bold'}}>Total</td>
						<td>{ pokemon.stats ? pokemon.stats.reduce((accumulator, currentVal) => accumulator + currentVal.base_stat, 0) : null}</td>
					</tr>
				</tbody>
			</table>
		</div>
	)
});
export default Stats;