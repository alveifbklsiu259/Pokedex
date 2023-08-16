import React, { memo } from "react";
import { useSelector } from 'react-redux';
import { selectLanguage } from "../display/displaySlice";
import { selectPokemonById, selectSpeciesById } from './pokemonDataSlice';
import Abilities from "./Abilities";
import { getTextByLanguage } from "../../util";

function getGender(gender_rate) {
	switch(gender_rate) {
		case -1 :
			return <i className="fa-regular fa-question"></i>
		case 0 :
			return <i className="fa-solid fa-mars"></i>;
		case 8 :
			return <i className="fa-solid fa-venus"></i>;
		default :
			return (
				<>
					<i className="fa-solid fa-mars"></i> / <i className="fa-solid fa-venus"></i>
				</>
			)
	};
};

const Detail = memo(function Detail({pokeId}) {
	const language = useSelector(selectLanguage);
	const pokemon = useSelector(state => selectPokemonById(state, pokeId));
	const speciesData = useSelector(state => selectSpeciesById(state, pokeId));

	const flavorText = getTextByLanguage(language, speciesData.flavor_text_entries, 'flavor_text');
	return (
		<>
			<div className="detail row text-center col-12 col-sm-6">
				<p className="my-4 col-6">Height <br /> <span>{pokemon.height * 10 } cm</span></p>
				<p className="my-4 col-6">Weight <br /> <span>{pokemon.weight * 100 / 1000 } kg</span></p>
				<p className="col-6 d-flex flex-column">Gender <br />
					<span className="mt-4">{getGender(speciesData.gender_rate)}</span>
				</p>
				<div className="col-6 abilities p-0">Abilities <br />
					<Abilities pokemon={pokemon} />
				</div>
				<p className="col-12 m-3 p-2 text-start description">{flavorText}</p>
			</div>
		</>
	)
});
export default Detail;