import { useState, useLayoutEffect, useRef, useId, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectStatus } from '../display/displaySlice';
import { selectSearchParam, selectAdvancedSearch, searchPokemon } from './searchSlice';
import { useNavigateNoUpdates } from '../../components/RouterUtils';
import AdvancedSearch from './AdvancedSearch';
import Input from './Input';
import pokeBall from '../../assets//pokeBall.png';

export default function Search({closeModal}) {
	const dispatch = useDispatch();
	const advancedSearch = useSelector(selectAdvancedSearch);
	const cachedSearchParam = useSelector(selectSearchParam);
	const [searchParam, setSearchParam] = useState(cachedSearchParam);
	const [selectedGenerations, setSelectedGenerations] = useState(advancedSearch.generations);
	const [selectedTypes, setSelectedTypes] = useState(advancedSearch.types);
	const [matchMethod, setMatchMethod] = useState('all');
	const collapseBtnRef = useRef(null);
	const collapseId = useId();
	const navigateNoUpdates = useNavigateNoUpdates();

	const handleIconChange = () => {
		if (collapseBtnRef.current.closest('button').getAttribute('aria-expanded') === 'true') {
			collapseBtnRef.current.classList.remove('fa-caret-down');
			collapseBtnRef.current.classList.add('fa-caret-up');
		} else {
			collapseBtnRef.current.classList.remove('fa-caret-up');
			collapseBtnRef.current.classList.add('fa-caret-down');
		};
	}

	const handleSubmit = async e => {
		e.preventDefault();

		// for search modal.
		if (closeModal) {
			closeModal();
		};

		if (document.querySelector('.sort')) {
			document.querySelector('.sort').scrollIntoView();
		} else {
			// could be displaying table or at pokemons/xxx.
			if (!document.querySelector('.viewMode')) {
				// at pokemons/xxx
				navigateNoUpdates('/', {state: 'resetPosition'});
			};
			setTimeout(() => {
				document.querySelector('.viewMode').scrollIntoView();
			}, 10);
		};
		dispatch(searchPokemon({searchParam, selectedGenerations, selectedTypes, matchMethod}));
	};
	
	useLayoutEffect(() => {
		// synchronizing state
		setSearchParam(cachedSearchParam);
		setSelectedGenerations(sg => JSON.stringify(advancedSearch.generations) !== JSON.stringify(sg) ? advancedSearch.generations : sg);
		setSelectedTypes(st => JSON.stringify(advancedSearch.types) !== JSON.stringify(st) ? advancedSearch.types : st);
	}, [cachedSearchParam, advancedSearch]);

	return (
		<div className="card-body mb-4 p-4">
			<h1 className="display-4 text-center">
				<img className='pokeBall' src={pokeBall} alt="pokeBall" width='46px' height='46px' /> Search For Pokémons
			</h1>
			<p className="lead text-center">By Name or the National Pokédex number</p>
			<form onSubmit={handleSubmit}>
				<Input
					searchParam={searchParam} 
					setSearchParam={setSearchParam}
				/>
					<div className="advancedSearch text-center mt-3">
						<button type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded='false' aria-controls={collapseId} onClick={handleIconChange}>
							Show Advanced Search <i ref={collapseBtnRef} className="fa-solid fa-caret-down"></i>
						</button>
						<AdvancedSearch
							setSearchParam={setSearchParam}
							selectedTypes={selectedTypes}
							setSelectedTypes={setSelectedTypes}
							selectedGenerations={selectedGenerations}
							setSelectedGenerations={setSelectedGenerations}
							setMatchMethod={setMatchMethod}
							collapseId={collapseId}
						/>
					</div>
				<SubmitBtn />
			</form>
		</div>
	)
};

const SubmitBtn = memo(function SubmitBtn() {
	const status = useSelector(selectStatus);
	return (
		<button
			disabled={status === 'loading' ? true : false}
			className="btn btn-primary btn-lg btn-block w-100 my-3" 
			type="submit"
		>
			Search
		</button>
	);
});