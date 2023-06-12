import { useState } from 'react';
import Spinner from './Spinner';
import { usePokemonData, useDispatchContenxt } from './PokemonsProvider';
import Modal from './Modal';

export default function Abilities({abilities, pokemon}) {
	const [isModalShown, setIsModalShown] = useState(false);
	const [isDetail, setIsDetail] = useState(false);
	const [abilityData, setAbilityData] = useState(null);
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const language = 'en'

	const handleShowModal = async ability => {
		const abilityKey = ability.replace('-', '_');

		if (abilityData && abilityData.name !== ability) {
			setAbilityData(null);
		};

		setIsModalShown(true);

		if (!state.abilities[abilityKey]) {
			const target = pokemon.abilities.find(entry => entry.ability.name === ability);
			const response = await fetch(target.ability.url);
			const data = await response.json();
			dispatch({type: 'abilityLoaded', payload: {abilityKey, data}});
			setAbilityData(data);
		} else {
			setAbilityData(state.abilities[abilityKey]);
		}
	}

	const handleShowDetail = () => {
		setIsDetail(!isDetail);
	};

	let brief, detail;

	if (abilityData) {
		brief = abilityData.flavor_text_entries?.find(flavor_text => flavor_text?.language?.name === language)?.flavor_text;
		detail = abilityData.effect_entries?.find(entry => entry?.language?.name === language)?.effect;
	};

	const customClass = `modalBody ${!abilityData && isModalShown ? 'modalLoading' : ''}`

	return (
		<>
			{abilities.map(ability => (
			<div key={ability}>
				<span className='me-2'>{ability}</span>
				<i onClick={() => {handleShowModal(ability)}} className="fa-solid fa-circle-question"></i>
				<br />
			</div>
			))}
			<Modal 
				customClass={customClass} 
				isModalShown={isModalShown} 
				setIsModalShown={setIsModalShown} 
				setIsDetail={setIsDetail}
			>
				{
					abilityData ? (
						<>
							<h1 className='abilityName my-2'>{abilityData.names.find(name => name.language.name === language).name}</h1>
							<div className='abilityDescription p-3'>
								<p>
									{
										isDetail ? detail ? detail : brief ? brief : 'No data to show' : brief ? brief : 'No data to show'
									}
								</p>
							</div>
							<div className='modalBtnContainer'>
								<button onClick={handleShowDetail} className="btn btn-warning">Show {isDetail ? 'Brief' : 'Detail'}</button>
							</div>
						</>
					) : (
						<Spinner />
					)
				}
			</Modal>
		</>
	)
};