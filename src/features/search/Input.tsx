import { useRef, useState, useMemo, memo, useCallback, forwardRef, type MutableRefObject, type ForwardedRef } from "react"
import { useSelector } from "react-redux";
import { selectAllIdsAndNames } from "../pokemonData/pokemonDataSlice";
import DataList from './DataList';
import { flushSync } from "react-dom";

type InputProps = {
	searchParam: string,
	setSearchParam: React.Dispatch<React.SetStateAction<string>>
}

const Input = forwardRef(function Input({searchParam, setSearchParam}: InputProps, forwardedInputRef: React.ForwardedRef<HTMLInputElement> | undefined) {
	const allPokemonNamesAndIds = useSelector(selectAllIdsAndNames);
	const [isDataListShown, setIsDataListShown] = useState(false);
	const [hoveredPokemon, setHoveredPokemon] = useState('');
	const [currentFocus, setCurrentFocus] = useState(-1);
	const datalistRef = useRef<HTMLDivElement>(null);
	
	// we don't have inputRef passed down from ErrorPage.js
	const inputRefForErrorPage = useRef<HTMLInputElement>(null);
	// we'll not use ref callback in out component
	const inputRef = useMemo(() => forwardedInputRef ? forwardedInputRef as React.RefObject<HTMLInputElement> : inputRefForErrorPage, [forwardedInputRef, inputRefForErrorPage]);


	const matchList = useMemo(() => {
		const match = Object.keys(allPokemonNamesAndIds).filter(name => name.toLowerCase().includes(searchParam.toLowerCase()));
		const sortedByStart = match.filter(name => name.startsWith(searchParam)).sort((a,b) => a.localeCompare(b));
		const remainderMatches = match.filter(name => !sortedByStart.includes(name)).sort((a,b) => a.localeCompare(b));
		return searchParam !== '' ? sortedByStart.concat(remainderMatches) : [];
	}, [allPokemonNamesAndIds, searchParam])

	const activePokemon = matchList[currentFocus];

	const resetFocus = useCallback((datalist: HTMLDivElement) => {
		setCurrentFocus(-1);
		// reset previous auto focus
		datalist.scrollTop = 0;
	}, []);

	const handleFocus = () => {
		if (matchList.length === 1 && matchList[0] === searchParam) {
			setIsDataListShown(false);
		} else if (searchParam !== '') {
			setIsDataListShown(true);
		};
	};

	const handleBlur = () => {
		// only blur out when not hovering pokemon names
		if (hoveredPokemon === '') {
			resetFocus(datalistRef.current!);
			setIsDataListShown(false);
		};
	};

	const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
		setIsDataListShown(true);
		setSearchParam(e.currentTarget.value);
		resetFocus(datalistRef.current!);
	};

	const handleClearInput = () => {
		flushSync(() => {setSearchParam('')});
		resetFocus(datalistRef.current!);
		// for mobile
		setHoveredPokemon('');
		inputRef.current!.focus();
	};

	const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
		const datalist = datalistRef.current;
		const focusName = (datalist: HTMLDivElement, nextFocus: number) => {
			setCurrentFocus(nextFocus);
			// auto focus on screen
			datalist.scrollTop = (datalist.children[nextFocus] as HTMLElement).offsetTop - datalist.offsetTop;
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
					focusName(datalist!, nextFocus);
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
					focusName(datalist!, nextFocus);
				};
				break;
			}
			// enter
			case 13 : {
				if (currentFocus > -1) {
					e.preventDefault();
					(datalist!.children[currentFocus] as HTMLElement).click();
				};
				// submit the form
				setIsDataListShown(false);
				break;
			}
			// escape
			case 27 : {
				setIsDataListShown(false);
				setSearchParam('');
				resetFocus(datalist!);
				break;
			}
			default : 
			// most of the input changes are handled by handleInput
		};
	}, [currentFocus, setSearchParam, matchList.length, resetFocus]);

	return (
		<div className="form-group position-relative searchInput">
			<div className="position-relative">
				<input
					ref={inputRef}
					autoComplete='off'
					id="searchInput"
					type="text"
					className={`form-control form-control-lg ${isDataListShown && matchList.length ? 'showDatalist' : ''}`}
					value={searchParam}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onInput={handleInput}
					onKeyDown={handleKeyDown}
				/>
				<i className={`fa-solid fa-xmark xmark ${!searchParam ? 'd-none' : ''}`} onClick={handleClearInput}></i>
			</div>
			<DataList
				matchList={matchList}
				ref={datalistRef}
				inputRef={inputRef}
				isDataListShown={isDataListShown}
				setIsDataListShown={setIsDataListShown}
				searchParam={searchParam}
				setSearchParam={setSearchParam}
				hoveredPokemon={hoveredPokemon}
				setHoveredPokemon={setHoveredPokemon}
				activePokemon={activePokemon}
				resetFocus={resetFocus}
			/>
		</div>
	)
});
export default memo(Input);