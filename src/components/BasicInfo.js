// instead of passing down pokemon, pass id or name and check caching
import { useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { useDispatchContenxt } from "./PokemonsProvider";
import Spinner from "./Spinner";
import { getIndividualPokemon } from "../api";


// this component is for memoization
export const PokemonCards = memo(function PokemonCards({pokemon}) {
	return (
		<div className="col-6 col-md-4 col-lg-3 card pb-3">
			<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
				<BasicInfo pokemon={pokemon}/>
			</Link>
		</div>
	)
});

const BasicInfo = function BasicInfo({pokemon}) {
	const dispatch = useDispatchContenxt();

	useEffect(() => {
		const prepareDate = async() => {
			if (typeof pokemon === 'string') {
				const data = await getIndividualPokemon(pokemon, dispatch);
				pokemon = data;
			};
		};
		prepareDate()
	}, [pokemon, getIndividualPokemon]);


	let content;
	if (typeof pokemon === 'string') {
		content = <Spinner />
	} else {
		content =  (
			<>
				<div className="d-flex flex-column align-items-center text-center p-0 h-100 justify-content-between">
				<img className="poke-img mx-auto p-0" src={pokemon.sprites.other['official-artwork'].front_default} alt={pokemon.name} />
				<span className="id p-0">#{String(pokemon.id).padStart(4 ,'0')}</span>
				<h1 className="p-0 text-capitalize">{pokemon.name}</h1>
				<div className="types row justify-content-center">
					{pokemon.types.map(type => <span key={type.type.name} className={`type-${type.type.name} type col-5 m-1`}>{type.type.name}</span>)}
				</div>	
				</div>
				
			</>
		)
	}

	return (
		<>
			{content}
		</>
	)
}

export default BasicInfo;