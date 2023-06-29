import React, { useState, useEffect, useCallback } from 'react';
import { usePokemonData, useDispatchContenxt } from './PokemonsProvider';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { getDataToFetch, getMultipleData } from '../api';
import { getIdFromURL, transformToDash } from '../util';

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

	const changeLanguage = async option => {
		const speciesData = state.pokemonSpecies;
		let fetchedSpeciesData, fetchedVersions, fetchedMoveDamageClass, fetchedStats;
		dispatch({type: 'languageChanged', payload: option});
		handleClose();

		if (Object.keys(state.pokemonSpecies).length !== state.pokemonCount || !Object.keys(state.versions).length || !Object.keys(state.move_damage_class).length || !Object.keys(state.stats).length) {
			dispatch({type: 'dataLoading'});
		};

		// get species, need all of them
		if (Object.keys(state.pokemonSpecies).length !== state.pokemonCount) {
			const range = [];
			for (let i = 1; i <= state.pokemonCount; i ++) {
				range.push(i)
			};
			const speciesDataToFetch = getDataToFetch(state.pokemonSpecies, range);
			fetchedSpeciesData = await getMultipleData('pokemon-species', speciesDataToFetch, 'id');
		};

		// get new name/id data
		const newNamesIds = Object.values(fetchedSpeciesData || speciesData).reduce((pre, cur) => {
			pre[cur.names.find(entry => entry.language.name === transformToDash(option)).name || cur.name] = cur.id;
			return pre
		}, {});

		// get versions, this data is only required when language is not 'en'
		if (!Object.keys(state.versions).length) {
			const response = await fetch('https://pokeapi.co/api/v2/version?limit=999');
			const data = await response.json();
			const versionsToFetch = data.results.map(data => getIdFromURL(data.url));
			fetchedVersions = await getMultipleData('version', versionsToFetch, 'name');
		};

		// get move-damage-class, this data is only required when language is not 'en'
		if (!Object.keys(state.move_damage_class).length) {
			const response = await fetch('https://pokeapi.co/api/v2/move-damage-class?limit=999');
			const data = await response.json();
			const moveDamageClassToFetch = data.results.map(data => getIdFromURL(data.url));
			fetchedMoveDamageClass = await getMultipleData('move-damage-class', moveDamageClassToFetch, 'name');
		};

		if (!Object.keys(state.stats).length) {
			const response = await fetch('https://pokeapi.co/api/v2/stat?limit=999');
			const data = await response.json();
			const statToFetch = data.results.map(data => getIdFromURL(data.url));
			fetchedStats = await getMultipleData('stat', statToFetch, 'name');
		};

		if (fetchedSpeciesData) {
			dispatch({type: 'pokemonSpeciesLoaded', payload: fetchedSpeciesData});
		};

		if (fetchedVersions) {
			dispatch({type:'getVersions', payload: fetchedVersions});
		};

		if (fetchedMoveDamageClass) {
			dispatch({type:'getMoveDamageClass', payload: fetchedMoveDamageClass});
		};

		if (fetchedStats) {
			dispatch({type:'getStats', payload: fetchedStats});
		};

		dispatch({type: 'pokemonNamesAndIdsLoaded', payload: newNamesIds});
		


		

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
				disabled={state.status === 'loading' ? true : false}
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
							borderRadius: 2,
							'&.Mui-disabled': {
								opacity: 1
							}
						}}
						key={option} 
						selected={option === language ? true : false} 
						onClick={() => {changeLanguage(option)}}
						disabled={option === state.language ? true : false}
					>
						{languageOptions[option]}
					</MenuItem>
				))}
			</Menu>
		</div>
	);
}