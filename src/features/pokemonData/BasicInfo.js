import { memo } from "react";
import { useSelector } from "react-redux";
import { selectLanguage } from "../display/displaySlice";
import { selectPokemonById, selectSpeciesById, selectTypes } from "./pokemonDataSlice";
import { getIdFromURL, getNameByLanguage, getFormName } from "../../util";

const BasicInfo = memo(function BasicInfo({pokeId}) {
	const pokemon = useSelector(state => selectPokemonById(state, pokeId));
	const speciesData = useSelector(state => selectSpeciesById(state, pokeId));
	const language = useSelector(selectLanguage);
	const types = useSelector(selectTypes)
	const nationalNumber = getIdFromURL(pokemon.species.url);

	const formName = getFormName(speciesData, language, pokemon);
	let newName;
	if (formName.includes('(')) {
		const pokemonName = formName.split('(')[0];
		const form = `(${formName.split('(')[1]}`;
		newName = (
			<>
	 		{pokemonName}
			<div className="pokemonName form">{form}</div>
		</>
		)
	};

	// search pokemon with name will have some error (change language)

	// what should be the render name, also consider when searching (search bar nar url bar...)
	//rayquaza-mega is the search name, but I want to display Mega rayquaza...
	// now when searching, color matching is not working on rayquaza
	
	return (
		<div className="basicInfo d-flex flex-column align-items-center text-center p-0 h-100">
			{/* width/heigh attributes are important for ScrollRestoration */}
			<img width='475' height='475' className="poke-img mx-auto p-0" src={pokemon.sprites.other['official-artwork'].front_default} alt={formName} />
			<span className="id p-0">#{String(nationalNumber).padStart(4 ,'0')}</span>
			<h1 className="p-0 text-capitalize">{newName || formName}</h1>
			<div className="types row justify-content-center">
				{pokemon.types.map(entry => (
					<span 
						key={entry.type.name} 
						className={`type-${entry.type.name} type col-5 m-1`}
					>
						{getNameByLanguage(entry.type.name, language, types[entry.type.name])}
					</span>
				))}
			</div>
		</div>
	)
});
export default BasicInfo;

// if I extrat name and types to their own component, when changing language, instead of the whole BasicInfo to re-render, just those two components re-render, is it gonna save a lot of time?