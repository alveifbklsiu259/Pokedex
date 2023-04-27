import { Link } from "react-router-dom";

export default function BasicInfo({pokemon}) {
	return (
		<>
			<div className='basic-info row col-12 col-sm-6 justify-content-center'>
				<Link to={`/pokemons/${pokemon.id}`}>
					<img className="poke-img mx-auto p-0 w-50" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`} alt={pokemon.name} />
					<div className="p-0 row text-center">
						<span className="p-0">#{pokemon.id}</span>
						<h1 className="p-0 text-capitalize">{pokemon.name}</h1>
						<div className="types">
							{pokemon.types.map(type => <span key={type.type.name} className={`type-${type.type.name}`}>{type.type.name}</span>)}
						</div>
					</div>
				</Link>
			</div>
		</>
	)
}