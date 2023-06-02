import { memo } from "react"

const Stats = memo(function Stats({pokemon}) {
	return (
		<div className="col-12 mt-5 stats">
			<h1 className="text-center" >Stats</h1>
			<table className="mx-auto">
				<tbody>
					{pokemon.stats ? pokemon.stats.map(stat => (
						<tr key={stat.stat.name}>
							<td className='text-capitalize' width='30%'> {stat.stat.name}</td>
							<td width='10%'>{stat.base_stat}</td>
							<td width='255px'>
								<div className="stat-bar-bg">
									<div className={`stat-bar stat-${stat.stat.name}`} style={{width: `${stat.base_stat / 255 * 100}%`}}></div>
								</div>
							</td>
						</tr>
					)) : null}
					<tr>
						<td style={{fontSize: 'bold'}}>Total</td>
						<td>{ pokemon.stats ? pokemon.stats.reduce((accumulator, currentVal) => accumulator + currentVal.base_stat, 0) : null}</td>
					</tr>
				</tbody>
			</table>
		</div>
	)
});
export default Stats;