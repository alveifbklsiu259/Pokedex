// instead of passing down pokemon, pass id or name and check caching

export default function BasicInfo({pokemon}) {
	const shownId = String(pokemon.id).padStart(4 ,'0');

	return (
		<>
			<img className="poke-img mx-auto p-0" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`} alt={pokemon.name} />
			<div className="p-0 row text-center">
				<span className="id p-0">#{shownId}</span>
				<h1 className="p-0 text-capitalize">{pokemon.name}</h1>
				<div className="types">
					{pokemon.types.map(type => <span key={type.type.name} className={`type-${type.type.name}`}>{type.type.name}</span>)}
				</div>
			</div>
		</>
	)
}