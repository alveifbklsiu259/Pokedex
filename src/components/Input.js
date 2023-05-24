import { useRef, useState } from "react"
import DataList from './DataList';
import { usePokemonData } from "./PokemonsProvider";

export default function Input({searchParam, setSearchParam}) {
	const {state} = usePokemonData();
	const [showDataList, setShowDataList] = useState(false);
	const [hoveredPokemon, setHoveredPokemon] = useState('');
	const [currentFocus, setCurrentFocus] = useState(-1);
	const pokemonNames = Object.keys(state.allPokemonNamesAndIds);
	const datalistRef = useRef(null);
	const inputRef = useRef(null);
	let matchList = [];

	const resetFocus = datalist => {
		setCurrentFocus(-1);
		// reset previous auto focus
		datalist.scrollTop = 0;
	};

	const handleFocus = () => {
		if (matchList.length === 1 && matchList[0] === searchParam) {
			setShowDataList(false);
		} else {
			setShowDataList(true);
		};
	};

	const handleBlur = () => {
		// only blur out when not hovering pokemon names
		if (hoveredPokemon === '') {
			resetFocus(datalistRef.current);
			setShowDataList(false);
		};
	};

	const handleInput = e => {
		setShowDataList(true);
		setSearchParam(e.target.value);
		resetFocus(datalistRef.current);
	};

	const handleKeyDown = e => {
		const datalist = datalistRef.current;
		const focusName = (datalist, nextFocus) => {
			setCurrentFocus(nextFocus);
			//auto focus on screen
			datalist.scrollTop = datalist.children[nextFocus].offsetTop - datalist.offsetTop
		};
		
		switch (e.keyCode) {
			// arrowDown
			case 40 : {
				e.preventDefault();
				if (matchList.length) {
					let nextFocus;
					if (currentFocus + 1 >= matchList.length) {
						nextFocus = 0
					} else {
						nextFocus = currentFocus + 1
					}
					focusName(datalist, nextFocus);
				};
				break;
			}
			// arrowUp
			case 38 : {
				e.preventDefault();
				if (matchList.length) {
					let nextFocus;
					if (currentFocus <= 0) {
						nextFocus = matchList.length - 1
					} else {
						nextFocus = currentFocus - 1
					}
					focusName(datalist, nextFocus);
				};
				break;
			}
			// enter
			case 13 : {
				if (currentFocus > -1) {
					e.preventDefault();
					datalist.children[currentFocus].click();
				};
				break;
			}
			// escape
			case 27 : {
				setShowDataList(false);
				setSearchParam('');
				resetFocus(datalist);
				break;
			}
			default : 
				// most of the input changes are handled by handleInput
		};
	};

	const match = pokemonNames.filter(name => name.toLowerCase().includes(searchParam.toLowerCase()));
	const sortedByStart = match.filter(name => name.startsWith(searchParam)).sort((a,b) => a.localeCompare(b));
	const remainderMatches = match.filter(name => !sortedByStart.includes(name)).sort((a,b) => a.localeCompare(b));

	if (searchParam !== '') {
		matchList = sortedByStart.concat(remainderMatches);
	};
	let activePokemon = matchList[currentFocus];

	return (
		<div className="form-group position-relative">
			<input
				ref={inputRef}
				autoComplete='off'
				id="searchInput"
				type="text"
				className={`form-control form-control-lg ${showDataList && matchList.length ? 'showDatalist' : ''}`}
				value={searchParam}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onInput={handleInput}
				onKeyDown={handleKeyDown}
			/>
			<DataList
				matchList={matchList}
				ref={datalistRef}
				inputRef={inputRef}
				showDataList={showDataList}
				setShowDataList={setShowDataList}
				searchParam={searchParam}
				setSearchParam={setSearchParam}
				hoveredPokemon={hoveredPokemon}
				setHoveredPokemon={setHoveredPokemon}
				activePokemon={activePokemon}
				resetFocus={resetFocus}
			/>
		</div>
	)
}