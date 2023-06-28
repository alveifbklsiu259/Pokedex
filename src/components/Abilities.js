import { useState, memo } from 'react';
import Spinner from './Spinner';
import { useDispatchContenxt, usePokemonData } from './PokemonsProvider';
import Modal from './Modal';
import { transformToKeyName, transformToDash } from '../util';

const Abilities = memo(function Abilities({abilities, pokemon, cachedAbilities}) {
	const [isModalShown, setIsModalShown] = useState(false);
	const [isDetail, setIsDetail] = useState(false);
	const [abilityData, setAbilityData] = useState(null);
	const dispatch = useDispatchContenxt();
	const state = usePokemonData();
	const language = state.language;

	const showModal = async ability => {
		const abilityKey = transformToKeyName(ability);

		if (abilityData && abilityData.name !== ability) {
			setAbilityData(null);
		};

		setIsModalShown(true);

		if (!cachedAbilities[abilityKey]) {
			const target = pokemon.abilities.find(entry => entry.ability.name === ability);
			const response = await fetch(target.ability.url);
			const data = await response.json();
			const result = {[abilityKey]: data};
			dispatch({type: 'abilityLoaded', payload: result});
			setAbilityData(data);
		} else {
			setAbilityData(cachedAbilities[abilityKey]);
		}
	}

	const showModalDetail = () => {
		setIsDetail(!isDetail);
	};

	let brief, detail;

	if (abilityData) {
		const getBrief = language => abilityData.flavor_text_entries?.find(flavor_text => flavor_text?.language?.name === transformToDash(language))?.flavor_text;
		brief = getBrief(language) || getBrief('en');

		const getDetail = language => abilityData.effect_entries?.find(entry => entry?.language?.name === transformToDash(language))?.effect;
		detail = getDetail(language) || getDetail('en');

		if (language === 'ja') {
			brief = brief.replaceAll('　', '');
			detail = detail.replaceAll('　', '');
		};
	};
	const customClass = `modalBody ${!abilityData && isModalShown ? 'modalLoading' : ''}`

	return (
		<>
			{abilities.map(ability => (
			<div key={ability}>
				<span className='me-2'>{ability}</span>
				<i onClick={() => {showModal(ability)}} className="fa-solid fa-circle-question"></i>
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
							<h1 className='abilityName my-2'>{abilityData.names.find(entry => entry.language.name === transformToDash(language)).name}</h1>
							<div className='abilityDescription p-3'>
								<p>
									{
										isDetail ? detail ? detail : brief ? brief : 'No data to show' : brief ? brief : 'No data to show'
									}
								</p>
							</div>
							<div className='modalBtnContainer'>
								<button onClick={showModalDetail} className="btn btn-warning">Show {isDetail ? 'Brief' : 'Detail'}</button>
							</div>
						</>
					) : (
						<Spinner />
					)
				}
			</Modal>
		</>
	)
});
export default Abilities;