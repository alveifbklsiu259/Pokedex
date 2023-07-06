import React, { useState, useEffect, useCallback } from 'react';
import { usePokemonData, useDispatchContenxt } from './PokemonsProvider';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { getDataToFetch, getData, getEndpointData, getAbilities } from '../api';
import { getNameByLanguage, transformToKeyName, transformToDash } from '../util';
import { useParams } from 'react-router-dom';
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
	// get all abilities for this pokemon (including different forms, evo? what if we are gonna have navigating to next/pre pokemon component later? are those pokemon required?)
	// when langeuage !== 'en', also fetch abilities when switching form tab (150)
	const {pokeId} = useParams();
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
		handleClose();

		let fetchedSpecies, fetchedVersions, fetchedMoveDamageClass, fetchedStats, fetchedAbilities;
		const isSpeciesReady = Object.keys(state.pokemonSpecies).length === state.pokemonCount;
		const isVersionsReady = Boolean(Object.keys(state.versions).length);
		const isMoveDamageClassReady = Boolean(Object.keys(state.move_damage_class).length);
		const isStatsReady = Boolean(Object.keys(state.stats).length);
		let isAbilitiesReady = pokeId ? state.pokemons[pokeId].abilities.every(entry => state.abilities[transformToKeyName(entry.ability.name)]) : true;

		if (!isSpeciesReady || !isVersionsReady || !isMoveDamageClassReady || !isStatsReady) {
			dispatch({type: 'dataLoading'});
		};

		// get species, need all of them.
		if (!isSpeciesReady) {
			const range = [];
			for (let i = 1; i <= state.pokemonCount; i ++) {
				range.push(i)
			};
			const speciesDataToFetch = getDataToFetch(state.pokemonSpecies, range);
			fetchedSpecies = await getData('pokemon-species', speciesDataToFetch, 'id');
		};

		// update name/id data
		const newNamesIds = Object.values(fetchedSpecies || speciesData).reduce((pre, cur) => {
			pre[getNameByLanguage(cur.name, option, cur)] = cur.id;
			return pre;
		}, {});
		const dataToFetch = response => response.results.map(data => data.url);

		// get versions, only required when language !== 'en'
		if (!isVersionsReady) {
			const versionsResponse = await getEndpointData('version');
			fetchedVersions = await getData('version', dataToFetch(versionsResponse), 'name');
		};

		// get move-damage-class, only required when language !== 'en'
		if (!isMoveDamageClassReady) {
			const moveDamageClassResponse = await getEndpointData('move-damage-class');
			fetchedMoveDamageClass = await getData('move-damage-class', dataToFetch(moveDamageClassResponse), 'name');
		};

		// get stats, only required when language !== 'en'
		if (!isStatsReady) {
			const statsResponse = await getEndpointData('stat');
			fetchedStats = await getData('stat', dataToFetch(statsResponse), 'name');
		};

		// to prevent Effect in Pokemon to run, get abilities when changing language on /pokemons/xxx.
		if (!isAbilitiesReady && option !== 'en') {
			fetchedAbilities = await getAbilities([state.pokemons[pokeId]], state.abilities);
		};

		// to batch dispatches
		if (fetchedSpecies) {
			dispatch({type: 'pokemonSpeciesLoaded', payload: fetchedSpecies});
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
		if (fetchedAbilities) {
			dispatch({type: 'abilityLoaded', payload: fetchedAbilities});
		};
		dispatch({type: 'pokemonNamesAndIdsLoaded', payload: newNamesIds});
		dispatch({type: 'languageChanged', payload: option});

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
						backgroundColor: '#0d6efd',
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
						onClick={() => changeLanguage(option)}
						disabled={option === state.language ? true : false}
					>
						{languageOptions[option]}
					</MenuItem>
				))}
			</Menu>
		</div>
	);
}