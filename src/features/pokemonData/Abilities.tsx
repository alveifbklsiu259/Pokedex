import { useState, memo } from 'react';
import { useSelector } from 'react-redux';
import { flushSync } from 'react-dom';
import { selectAbilities, abilityLoaded, type CachedAbility } from './pokemonDataSlice';
import { selectLanguage } from '../display/displaySlice';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import { transformToKeyName, transformToDash, getNameByLanguage, getTextByLanguage } from '../../util';
import { getAbilitiesToDisplay, getData } from '../../api';
import type { Pokemon, Ability } from '../../../typeModule';
import { useAppDispatch } from '../../app/hooks';

type AbilitiesProps = {
	pokemon: Pokemon.Root
};

const Abilities = memo<AbilitiesProps>(function Abilities({pokemon}) {
	const dispatch = useAppDispatch();
	const abilities = useSelector(selectAbilities);
	const language = useSelector(selectLanguage);
	const [isModalShown, setIsModalShown] = useState(false);
	const [isDetail, setIsDetail] = useState(false);
	const [abilityData, setAbilityData] = useState<Ability.Root | null>(null);
	const abilitiesToDisplay = getAbilitiesToDisplay(pokemon).map(ability => transformToDash(ability));

	const showModal = async (ability: string) => {
		const abilityKey = transformToKeyName(ability);
		let fetchedAbility: CachedAbility | undefined;

		// for spinner to show
		if (abilityData?.name !== ability) {
			setAbilityData(null);
		};

		setIsModalShown(true);
		if (!abilities[abilityKey]) {
			fetchedAbility = await getData('ability', ability, 'name');
			// for some reason redux's state update and local state update will not be batched if in the current component it's listening for the redux state that's gonna be updated and there's any await expression before the state updates, I just found out that flushSynch will help solve this problem, so use it to batch the state updates.
			flushSync(() => {
				dispatch(abilityLoaded(fetchedAbility!));
				setAbilityData(fetchedAbility![abilityKey]);
			});
		} else {
			setAbilityData(abilities[abilityKey]);
		};
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
			{abilitiesToDisplay.map(ability => (
			<div key={ability}>
				<span className='me-2'>{getNameByLanguage(ability, language, abilities[transformToKeyName(ability)])}</span>
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