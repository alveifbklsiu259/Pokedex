import { forwardRef } from "react";
import { flushSync } from "react-dom";
import { useSelector } from "react-redux";
import { selectAllIdsAndNames } from "../features/pokemonData/pokemonDataSlice";

const DataList = forwardRef(function DataList({
	matchList,
	inputRef,
	searchParam,
	setSearchParam,
	resetFocus,
	setShowDataList,
	showDataList,
	hoveredPokemon,
	setHoveredPokemon,
	activePokemon,
}, datalistRef) {
	const allPokemonNamesAndIds = useSelector(selectAllIdsAndNames);
	const handleMouseOver = pokemon => {
		setHoveredPokemon(pokemon);
	};

	const handleMouseLeave = () => {
		setHoveredPokemon('')
	};

	const handleClick = pokemon => {
		const input = inputRef.current;
		setHoveredPokemon('');
		resetFocus(datalistRef.current);
		// handleFocus needs the latest matchList, since matchList is calculated by searchParam, use flushSync.
		flushSync(() => {
			setSearchParam(pokemon);
		});
		input.focus();
		setShowDataList(false);
	};

	// because on mobile device, there's no "hover", hover detection happens when tapping on something (without let go), so at each touch end (hover detection on mobile) we reset the hovered pokemon; when the mobile user click any item (which will not trigger hover event) we trigger click event.
	const handleTouchEnd = (e, pokemon) => {
		if (!hoveredPokemon) {
			// prevent click firing twice
			e.preventDefault();
			handleClick(pokemon);
		};
		// for onBlur to work on mobile
		setHoveredPokemon('');
	};

	const colorMatching = (pokemonName, searchParam) => {
		const lowerCaseSearchParam = searchParam.toLowerCase();
		return (
			<>
				{
					pokemonName.split(lowerCaseSearchParam).reduce((previousReturn, currentElement, index) => {
						if (index === 0) {
							return [currentElement];
						} else {
							return previousReturn.concat(<span className="matchedCharacter" key={index}>{lowerCaseSearchParam}</span>, currentElement);
						};
					}, [])
				}
			</>
		);
	};
	return (
		<div ref={datalistRef} id='pokemonDataList' className={showDataList && matchList.length ? 'showDatalist' : ''}>
			{matchList.map(pokemon => (
				<div
					className={`${hoveredPokemon === pokemon ? 'datalist_hover' : ''} ${activePokemon === pokemon ? 'datalist_active' : ''}`}
					onMouseOver={() => {handleMouseOver(pokemon)}}
					onMouseLeave={handleMouseLeave}
					onClick={() => {handleClick(pokemon)}}
					// for mobile device
					onTouchMove={() => {handleMouseOver(pokemon)}}
					onTouchEnd={(e) => handleTouchEnd(e, pokemon)}
					key={pokemon}
				>
					<span>{colorMatching(pokemon, searchParam)}</span>
					<img width='96px' height='96px' src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${allPokemonNamesAndIds[pokemon]}.png`} alt={pokemon}/>
				</div>
			))}
		</div>
	)
});
export default DataList;