import { forwardRef} from "react";
import { flushSync } from "react-dom";

const DataList = forwardRef(({matchList, inputRef, searchParam, setSearchParam, resetFocus, setShowDataList, showDataList, hoveredPokemon, setHoveredPokemon, activePokemon}, datalistRef) => {

	const handleMouseOver = e => {
		setHoveredPokemon(e.target.textContent)
	};

	const handleMouseLeave = () => {
		setHoveredPokemon('')
	};

	const handleClick = (e) => {
		const input = inputRef.current;
		setHoveredPokemon('');
		setShowDataList(false);
		resetFocus(datalistRef.current);
		// handleFocus needs the latest matchList, since matchList is calculated by searchParam, use flushSync
		flushSync(() => {
			setSearchParam(e.target.textContent);
		});
		input.focus();
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
							return previousReturn.concat(<span className="nameMatch" key={index}>{lowerCaseSearchParam}</span>, currentElement);
						}
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
					onMouseOver={handleMouseOver}
					onMouseLeave={handleMouseLeave}
					onClick={handleClick}
					key={pokemon}
				>{colorMatching(pokemon, searchParam)}
				</div>
			))}
		</div>
	)
});

export default DataList