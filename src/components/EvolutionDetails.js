import { useState } from "react";
import Modal from "./Modal";
import { usePokemonData } from "./PokemonsProvider"

const textsForOtherRequirements = {
	gender: 'Gender',
	held_item: 'Hold Item',
	item: 'Use Item',
	known_move: 'Know Move',
	known_move_type: 'Know Move Type',
	location: 'Location',
	min_affection: 'Minimum Affection',
	min_beauty: 'Minimum Beauty',
	min_happiness: 'Minimum Happiness',
	min_level: 'Minimum Level',
	needs_overworld_rain: "During rain",
	party_species: "With Pokemon In Party",
	party_type: 'With xxx-type Pokemon In Party',
	relative_physical_stats: 'Attack : Defense', // -1: < , 1: >, 0: =
	time_of_day: 'Time of Day',
	trade_species: 'Trade for',
	turn_upside_down: 'Hold game system upside-down'
};

export default function EvolutionDetails({chainId, pokemonId}) {
	const [isModalShown, setIsModalShown] = useState(false);

	const state = usePokemonData();
	const chainDetails = state.evolutionChains[chainId].details[pokemonId];

	// handle some exceptions
	let selectedDetail = chainDetails[0];
	if (chainDetails.length > 1 && chainDetails.find(chainDetail => chainDetail.trigger.name === 'use-item')) {
		selectedDetail = chainDetails.find(chainDetail => chainDetail.trigger.name === 'use-item')
	};

	const requirements = Object.entries(selectedDetail)
		.filter(([condition, value]) => (value || value === 0) && condition !== 'trigger')
		.reduce((pre, cur) => {
			// if it's an object, just pass the name
			pre[cur[0]] = typeof cur[1] === 'object' ? cur[1].name : cur[1];
			return pre;
		}, {});

	const trigger = selectedDetail.trigger.name;

	let mainText;
	switch(trigger) {
		case 'level-up' : 
			if (requirements["min_level"]) {
				mainText = `Level ${requirements["min_level"]}`
				delete requirements["min_level"];
			} else {
				mainText = `Level up`
			};
			break;

		case 'trade' : 
			mainText = `Trade`
			break;

		case 'use-item' : 
			if (requirements["item"]) {
				mainText = (
					<>
						<span>{`Use ${requirements["item"]}`}</span>
						<img className="item" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${requirements["item"]}.png`} alt={`${requirements["item"]}`} />
					</>
				)
				delete requirements["item"];
			};
			break;
		
		case 'shed' : 
			mainText = 'Level 20, Empty spot in party, Pokéball in bag';
			break;

		default : 
			mainText = '';
	};

	const rephrase = (requirements, requirement) => {
		let value = requirements[requirement];

		switch(requirement) {
			case 'gender' : 
				switch (value) {
					case 1 : {
						value = <i className="fa-solid fa-venus"></i>
						break;
					}
					default : {
						value = <i className="fa-solid fa-mars"></i>
					}
				}
				break;

				case 'relative_physical_stats' :
				switch (value) {
					case 1 : {
						value = 'Attack > Defense';
						break;
					}
					case -1 : {
						value = 'Attack < Defense';
						break;
					}
					default : {
						value = 'Attack = Defense';
					}
				}
				break;

			case 'held_item' : 
				value = (
					<>
						{value}
						<img className="item" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${value}.png`} alt={`${value}`} />
					</>
				)
				break;
			
			default : 
				value = requirements[requirement];
		};

		if (value === true) {
			value = <i className="fa-solid fa-check"></i>
		};
		return value;
	};

	const otherRequirements = (
		<ul className="p-0 mt-2 mb-4">
			{
				Object.keys(requirements).map(requirement => (
					<li key={requirement}>
						{textsForOtherRequirements[requirement]} : {rephrase(requirements, requirement)}
					</li>
				))
			}
		</ul>
	);

	const handleShowModal = () => {
		setIsModalShown(true);
	};

	return (
		<>
			<div className="evolutionDetails">
				<div className="mainText">{mainText}</div>
				{Object.keys(requirements).length ? <i className="fa-solid fa-circle-info" onClick={handleShowModal}></i> : ''}
			</div>
			{
				Object.keys(requirements).length > 0 && (
					<Modal
						customClass='modalBody evolutionDetailsModal'
						isModalShown={isModalShown} 
						setIsModalShown={setIsModalShown}
					>
						<h1 className='my-2'>Other Requirements</h1>
						{otherRequirements}
					</Modal>
				)
			}
		</>
	)
}