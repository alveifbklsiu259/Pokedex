import { useState, memo } from 'react';
import Spinner from './Spinner';
import Modal from './Modal';
import { transformToKeyName, transformToDash, getNameByLanguage, getTextByLanguage } from '../util';
import { getAbilitiesToDisplay, getData } from '../api';
import { useSelector, useDispatch } from 'react-redux';
import { selectPokeData, abilityLoaded } from '../features/pokemonData/pokemonDataSlice';


const Abilities = memo(function Abilities({pokemon}) {
	const dispatch = useDispatch();
	const state = useSelector(selectPokeData);
	const [isModalShown, setIsModalShown] = useState(false);
	const [isDetail, setIsDetail] = useState(false);
	const [abilityData, setAbilityData] = useState(null);
	const language = state.language;
	const abilities = getAbilitiesToDisplay(pokemon).map(ability => transformToDash(ability));

	const showModal = async ability => {
		const abilityKey = transformToKeyName(ability);
		let fetchedAbility;

		// for spinner to show
		if (abilityData?.name !== ability) {
			setAbilityData(null);
		};

		setIsModalShown(true);

		if (!state.abilities[abilityKey]) {
			fetchedAbility = await getData('ability', ability, 'name');
			dispatch(abilityLoaded(fetchedAbility));
		};

		setAbilityData(fetchedAbility?.[abilityKey] || state.abilities[abilityKey]);
	};

	const showModalDetail = () => {
		setIsDetail(!isDetail);
	};

	let brief, detail;

	if (abilityData) {
		brief = getTextByLanguage(language, abilityData.flavor_text_entries, 'flavor_text');
		detail = getTextByLanguage(language, abilityData.effect_entries, 'effect');
	};
	const customClass = `modalBody ${!abilityData && isModalShown ? 'modalLoading' : ''}`

	return (
		<>
			{abilities.map(ability => (
			<div key={ability}>
				<span className='me-2'>{getNameByLanguage(ability, language, state.abilities[transformToKeyName(ability)])}</span>
				<i onClick={() => {showModal(ability)}} className="fa-solid fa-circle-question"></i>
				<br />
			</div>
			))}
			{isModalShown && (
				<Modal
					customClass={customClass} 
					isModalShown={isModalShown} 
					setIsModalShown={setIsModalShown} 
					setIsDetail={setIsDetail}
				>
					{
						abilityData ? (
							<>
								<h1 className='abilityName my-2'>{getNameByLanguage(abilityData.name, language, abilityData)}</h1>
								<div className='abilityDescription p-3'>
									<p>
										{
											isDetail ? (detail ? detail : (brief ? brief : 'No data to show')) : brief ? brief : 'No data to show'
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
			)}
		</>
	)
});
export default Abilities;