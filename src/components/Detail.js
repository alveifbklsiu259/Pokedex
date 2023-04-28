import React from "react";
export default function Detail({pokemon, speciesInfo}) {
	function getGender() {
		switch(speciesInfo.gender_rate) {
			case -1 :
				return <i class="fa-regular fa-question"></i>
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
	}

	return (
		<div className="detail row text-center col-12 col-sm-6">
			<p className="my-4 col-6">Height <br /> <span>{pokemon.height * 10 } cm</span></p>
			<p className="my-4 col-6">Weight <br /> <span>{pokemon.weight * 100 / 1000 } kg</span></p>
			<p className="col-6 d-flex flex-column">Gender <br />
			<span className="mt-4">{getGender()}</span>
			</p>
			<p className="col-6">Abilities <br />
			{pokemon.abilities.map(ability => (
				<React.Fragment key={ability.ability.name}>
					<span>{ability.ability.name}</span>
					<br/>
				</React.Fragment>
			))}
			</p>
			<p className="col-12 m-3 p-2 text-start description">{(speciesInfo?.flavor_text_entries && speciesInfo?.flavor_text_entries[0].flavor_text) ? speciesInfo?.flavor_text_entries[0].flavor_text : ''}</p>
		</div>
	)
}