import React, { memo } from "react";
import Abilities from "./Abilities";

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
	}
};

const Detail = memo(function Detail({pokemon, speciesInfo}) {
	const flavorTexts = speciesInfo.flavor_text_entries;
	let flavorText = '';
	if (flavorTexts.length) {
		flavorText =  flavorTexts.find(text => text.language.name === 'en').flavor_text
	};
	const abilitiesArray = pokemon.abilities.map(ability => ability.ability.name);
	// there're some duplications from the api
	const abilities = new Set(abilitiesArray);

	return (
		<>
			<div className="detail row text-center col-12 col-sm-6">
				<p className="my-4 col-6">Height <br /> <span>{pokemon.height * 10 } cm</span></p>
				<p className="my-4 col-6">Weight <br /> <span>{pokemon.weight * 100 / 1000 } kg</span></p>
				<p className="col-6 d-flex flex-column">Gender <br />
					<span className="mt-4">{getGender(speciesInfo.gender_rate)}</span>
				</p>
				<div className="col-6 abilities p-0">Abilities <br />
					<Abilities pokemon={pokemon} abilities={[...abilities]}/>
				</div>

				<p className="col-12 m-3 p-2 text-start description">{flavorText}</p>
			</div>
		</>
	)
});
export default Detail;