import { forwardRef, memo } from "react";
import { flushSync } from "react-dom";
import { useSelector } from "react-redux";
import { selectAllIdsAndNames } from "../pokemonData/pokemonDataSlice";

type DataListProps = {
	matchList: string[],
	inputRef: React.RefObject<HTMLInputElement>,
	isDataListShown: boolean,
	setIsDataListShown: React.Dispatch<React.SetStateAction<boolean>>,
	searchParam: string,
	setSearchParam: React.Dispatch<React.SetStateAction<string>>,
	hoveredPokemon: string,
	setHoveredPokemon: React.Dispatch<React.SetStateAction<string>>,
	activePokemon: string,
	resetFocus: (datalist: HTMLDivElement) => void
};

const DataList = forwardRef<HTMLDivElement, DataListProps>(function DataList({
	matchList,
	inputRef,
	isDataListShown,
	setIsDataListShown,
	searchParam,
	setSearchParam,
	hoveredPokemon,
	setHoveredPokemon,
	activePokemon,
	resetFocus
}, datalistRef) {

	return (
		<div ref={datalistRef} id='pokemonDataList' className={isDataListShown && matchList.length ? 'showDatalist' : ''}>
			{matchList.map(pokemon => (
				<ListItem
					// not using datalistRef as ref callback
					datalistRef={datalistRef as React.RefObject<HTMLInputElement>}
					inputRef={inputRef}
					setIsDataListShown={setIsDataListShown}
					searchParam={searchParam}
					setSearchParam={setSearchParam}
					// passing hoveredPokemon/activePokemon will break memoization when hovering/focusing list item.
					isHovered={hoveredPokemon === pokemon}
					isActive={activePokemon === pokemon}
					setHoveredPokemon={setHoveredPokemon}
					resetFocus={resetFocus}
					pokemon={pokemon}
					key={pokemon}
				/>
			))}
		</div>
	)
});
export default DataList;

type ListItemProps = {
	datalistRef: React.RefObject<HTMLInputElement>,
	inputRef: React.RefObject<HTMLInputElement>,
	setIsDataListShown: React.Dispatch<React.SetStateAction<boolean>>,
	searchParam: string,
	setSearchParam: React.Dispatch<React.SetStateAction<string>>,
	isHovered: boolean,
	setHoveredPokemon: React.Dispatch<React.SetStateAction<string>>,
	isActive: boolean,
	resetFocus: (datalist: HTMLDivElement) => void,
	pokemon: string
};

const ListItem = memo<ListItemProps>(function ListItem({
	datalistRef,
	inputRef,
	setIsDataListShown,
	searchParam,
	setSearchParam,
	isHovered,
	setHoveredPokemon,
	isActive,
	resetFocus,
	pokemon
}) {
	const allPokemonNamesAndIds = useSelector(selectAllIdsAndNames);

	const handleMouseOver = (pokemon: string) => {
		setHoveredPokemon(pokemon);
	};

	const handleMouseLeave = () => {
		setHoveredPokemon('')
	};

	const handleClick = (pokemon: string) => {
		const input = inputRef.current;
		setHoveredPokemon('');
		resetFocus(datalistRef.current!);
		// handleFocus needs the latest matchList, since matchList is calculated by searchParam, use flushSync.
		flushSync(() => {
			setSearchParam(pokemon);
		});
		input!.focus();
		setIsDataListShown(false);
	};

	// because on mobile device, there's no "hover", hover detection happens when tapping on something (without let go), so at each touch end (hover detection on mobile) we reset the hovered pokemon; when the mobile user click any item (which will not trigger hover event) we trigger click event.
	const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, pokemon: string) => {
		if (!isHovered) {
			// prevent click firing twice
			e.preventDefault();
			handleClick(pokemon);
		};
		// for onBlur to work on mobile
		setHoveredPokemon('');
	};

	// /React.JSX.Element

	// should I move colorMatching out to DataList?

	// can i add a transition (when i'm still typing, the datalist will not change.)?(you can test, type in some value then keep the delete down, it will lags a bit)

	const colorMatching = (pokemonName: string, searchParam: string | number) => {
		const lowerCaseSearchParam = String(searchParam).toLowerCase();
		const splitString = pokemonName.split(lowerCaseSearchParam) as [string, string];
		return (
			<>
				{
					splitString.reduce<(string | React.JSX.Element)[]>((previousReturn, currentElement, index) => {
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
		<div
			className={`${isHovered ? 'datalist_hover' : ''} ${isActive ? 'datalist_active' : ''}`}
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
	)
});