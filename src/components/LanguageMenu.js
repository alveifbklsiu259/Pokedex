import React, { useState, useEffect, useCallback } from 'react';
import { usePokemonData, useDispatchContenxt } from './PokemonsProvider';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { getDataToFetch, getMultipleData } from '../api';
import { transformToDash } from '../util';

const languageOptions = {
	en: 'English',
	ja: '日本語',
	zh_Hant: '繁體中文',
	zh_Hans: '简体中文',
	ko: '한국어',
	fr: 'Français',
	de: 'Deutsch',
};

export default function LanguageMenu() {
	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);
	const state = usePokemonData();
	const dispatch = useDispatchContenxt();
	const language = state.language;
	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = useCallback(() => {
		setAnchorEl(null);
	}, [setAnchorEl])

	useEffect(() => {
		window.addEventListener('scroll', handleClose);
		return () => {
			window.removeEventListener('scroll', handleClose)
		};
	}, [handleClose]);

	const changeLanguage = async e => {
		let speciesData = state.pokemonSpecies;
		handleClose();
		const selectedLanguage = Object.keys(languageOptions).find(option => languageOptions[option] === e.target.outerText);
		dispatch({type: 'languageChanged', payload: selectedLanguage});

		// get species
		const range = [];
		for (let i = 1; i <= state.pokemonCount; i ++) {
			range.push(i)
		};
		const speciesDataToFetch = getDataToFetch(state.pokemonSpecies, range);
		if (speciesDataToFetch.length) {
			dispatch({type: 'dataLoading'});
			const fetchedSpeciesData = await getMultipleData('pokemon-species', speciesDataToFetch, 'id');
			dispatch({type: 'pokemonSpeciesLoaded', payload: fetchedSpeciesData});
			speciesData = fetchedSpeciesData;
		};
		const pokemonsNamesAndId = Object.values(speciesData).reduce((pre, cur) => {
			pre[cur.names.find(entry => entry.language.name === transformToDash(selectedLanguage)).name || cur.name] = cur.id;
			return pre
		}, {});
		dispatch({type: 'pokemonNamesAndIdsLoaded', payload: pokemonsNamesAndId});

		// I'll currently read language from state, when the logic is done, see if we can pass language down instead of reading from state
		// search state.language
		
		
		// if on root
		// fetch pokemon-species to get relevant names, --> when click language btn, fetch pokemon-species, then fetch pokemon-species when scrolling.
		// fetch types  to get relevant types
		// datalist

		// if on pokemon, we also need
		// abilities
		// flavor text
		// version names
		// moves name
		// move effect, flavor text

		// translate height, weight, stats,


		//A form field element should have an id or name attribute
	};

	return (
		<div>
			<Button
				id="language-button"
				size='large'
				variant="contained"
				sx={{ml: 1}}
				aria-controls={open ? 'language-menu' : undefined}
				aria-haspopup="true"
				aria-expanded={open ? 'true' : undefined}
				onClick={handleClick}
			>
				<i className="fa-solid fa-language"></i>
			</Button>
			<Menu
				disableScrollLock={true}
				id="language-menu"
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'center',
				}}
				MenuListProps={{
					'aria-labelledby': 'language-button',
				}}
				sx={{
					'& .MuiMenuItem-root:hover': {
						backgroundColor: '#8bbaff',
					},
					'& .MuiMenuItem-root.Mui-selected': {
						backgroundColor: '#0d6efd !important',
					},
				}}
			>
				{Object.keys(languageOptions).map(option => (
					<MenuItem
						sx={{
							mx: 1,
							my: 0.4,
							borderRadius: 2
						}}
						key={option} 
						selected={option === language ? true : false} 
						onClick={changeLanguage}
						value={option}
					>
						{languageOptions[option]}
					</MenuItem>
				))}
			</Menu>
		</div>
	);
}