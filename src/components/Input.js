import { useRef, useEffect, useState } from "react"

export default function Input({searchParam: {searchParam, setSearchParam}}) {
	const [pokemonNames, setPokemonNames] = useState([]);
	let matchList = [];
	const currentFocusRef = useRef(-1);
	const inputRef = useRef(null);
	const datalistRef = useRef(null);


// error selecting

	useEffect(() => {
		const getPokemonNames = async () => {
			const response = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=10000');
			const data = await response.json();
			setPokemonNames(data.results.map(pokemon => pokemon.name))
		};
		getPokemonNames();
	}, [setPokemonNames]);

	const handleFocus = e => {
		const input = inputRef.current;
		const datalist = datalistRef.current;


		if (searchParam ) {
			datalist.style.display = 'block';
			input.style.borderRadius = "5px 5px 0 0";
		}

		console.log(matchList)
		// console.log(e.target.value)
		// if (!(datalist.children.length === 1 && e.target.value === datalist.children[0].outerText)) {
		// 	datalist.style.display = 'block';
		// 	input.style.borderRadius = "5px 5px 0 0";
		// }
	}

	// blur reset text error
// reset does not clear out match list, when you type in something, reset, the list still there  iron-bundlei

// iron-bundle
//bundleis

// click option --> click input filed again --> keep selecting --> error  // doesn't seem like colorfunction's problem
	const handleBlur = () => {
		const input = inputRef.current;
		const datalist = datalistRef.current;
		if (!datalist.classList.contains('hovering')) {
			datalist.style.display = 'none';
			input.borderRadius = '5px';
		};
	};

	const handleInput = e => {
		const datalist = datalistRef.current;
		setSearchParam(e.target.value);
		// reset previous auto focus
		datalist.scrollTop = 0;
	};

	const handleMouseOver = e => {
		const datalist = datalistRef.current;
		e.target.classList.add('datalist_hover');
		datalist.classList.add('hovering');
	}

	const handleMouseLeave = e => {
		const datalist = datalistRef.current;
		e.target.classList.remove('datalist_hover');
		datalist.classList.remove('hovering');
	}

	const handleClick = (e) => {
		const input = inputRef.current;
		const datalist = datalistRef.current;
		setSearchParam(() => e.target.textContent);
		datalist.style.display = 'none';
		input.borderRadius = '5px';
		currentFocusRef.current = -1;
		input.focus();
	}

	const handleKeyDown = e => {
		const datalist = datalistRef.current;
		const input = inputRef.current;

		function removeActive(datalist) {
			for (let i = 0; i < datalist.length; i++) {
				datalist[i].classList.remove("datalist_active");
			};
		};

		function addActive (datalist, currentFocus) {
			datalist.children[currentFocus].classList.add('datalist_active');
			//auto focus on screen
			datalist.scrollTop = datalist.children[currentFocus].offsetTop - datalist.offsetTop
		};
		
		switch (e.keyCode) {
			// arrowDown
			case 40 : {
				e.preventDefault();
				removeActive(datalist.children);
				if (datalist.children.length) {
					if (currentFocusRef.current + 1 >= datalist.children.length) {
						currentFocusRef.current = 0;
					} else {
						currentFocusRef.current ++
					};
					addActive(datalist, currentFocusRef.current);
				}
				break;
			}
			// arrowUp
			case 38 : {
				e.preventDefault();
				removeActive(datalist.children);
				if (datalist.children.length) {
					if (currentFocusRef.current <= 0) {
						currentFocusRef.current = datalist.children.length - 1
					} else {
						currentFocusRef.current --
					}
					addActive(datalist, currentFocusRef.current)
				}
				break;
			}
			// enter
			case 13 : {
				if (currentFocusRef.current > -1) {
					e.preventDefault();
					datalist.children[currentFocusRef.current].click();
					removeActive(datalist.children);
				};
				break;
			}
			// escape
			case 27 : {
				datalist.style.display = 'none';
				input.borderRadius = '5px';
				setSearchParam('');
				currentFocusRef.current = -1;
				break;
			}
			// reset currentFocus
			default : {
				currentFocusRef.current = -1
				datalist.style.display = 'block';
				input.style.borderRadius = "5px 5px 0 0";
			};
		};
	};

	const match = pokemonNames.filter(name => name.toLowerCase().includes(searchParam.toLowerCase()));
	const sortedByStart = match.filter(name => name.startsWith(searchParam)).sort((a,b) => a.localeCompare(b));
	const remainderMatches = match.filter(name => !sortedByStart.includes(name)).sort((a,b) => a.localeCompare(b));
	
	if (searchParam !== '') {
		matchList = sortedByStart.concat(remainderMatches);
	};





















	const colorMatching = (str, param) => {
		const indexOfMatch = str.indexOf(param)
		const paramLength = param.length
		const strLength = str.length

		if (param !== '') {
			if (indexOfMatch === 0 && paramLength === strLength) {
				// full match
				return (
					<span className="match_character">{param}</span>
				)
			} else if (indexOfMatch === 0) {
				// match at the begining
				return (
					<>
						<span className="match_character">{param}</span>
						<span>{str.substr(paramLength)}</span>
					</>
				)
			} else if (paramLength + indexOfMatch < strLength) {
				// match in the middle
				return (
					<>
						<span>{str.substr(0, indexOfMatch)}</span>
						<span className="match_character">{param}</span>
						<span>{str.substr(indexOfMatch + paramLength)}</span>
					</>
				)

			} else if (paramLength + indexOfMatch === strLength) {
				// match at the end
				return (
					<>
						<span>{str.substr(0, indexOfMatch)}</span>
						<span className="match_character">{param}</span>
					</>
				)
			}
		} else {
			return str
		}
	}


	return (
		<div className="form-group position-relative">
			<input 
				autoComplete='off' 
				ref={inputRef} 
				id="searchInput" 
				type="text" 
				className="form-control form-control-lg" 
				value={searchParam} 
				onFocus={handleFocus} 
				onBlur={handleBlur}
				onInput={handleInput} 
				onKeyDown={handleKeyDown}
			/>
			<div ref={datalistRef} id='pokemonDataList'>
				{matchList.map(pokemon => (
				<div 
					onMouseLeave={handleMouseLeave}
					onMouseOver={handleMouseOver}
					onClick={handleClick}
					key={pokemon}
				>{colorMatching(pokemon, searchParam) }
					{/* {colorMatching(pokemon, searchParam) } */}
				</div>
				))}
			</div>
		</div>
	)
}