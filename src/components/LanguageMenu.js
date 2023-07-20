import React, { useState, useEffect, useCallback } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { getAllSpecies, getRequiredData } from '../api';
import { getIdFromURL, getNameByLanguage } from '../util';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectPokeData } from '../features/pokemonData/pokemonDataSlice';
import { pokemonNamesAndIdsLoaded, languageChanged } from '../features/pokemonData/pokemonDataSlice';

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
	const state = useSelector(selectPokeData);
	const dispatch = useDispatch();
	const {pokeId} = useParams();
	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);
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
			window.removeEventListener('scroll', handleClose);
		};
	}, [handleClose]);
		
	const changeLanguage = async option => {
		const hasAllSpecies = Object.keys(state.pokemonSpecies).length === state.pokemonCount;
		const callback = !hasAllSpecies ? getAllSpecies : undefined;
		let requests = pokeId ? ['pokemons', 'abilities', 'items', 'version', 'move-damage-class', 'stat'] : ['version', 'move-damage-class', 'stat'];
		
		let requestPokemonIds = pokeId ? state.pokemonSpecies[getIdFromURL(state.pokemons[pokeId].species.url)].varieties.map(variety => getIdFromURL(variety.pokemon.url)) : [undefined];

		handleClose();
		const speciesData = await getRequiredData(state, dispatch, requestPokemonIds, requests, option, callback) || state.pokemonSpecies;
		const newNamesIds = Object.values(speciesData).reduce((pre, cur) => {
			pre[getNameByLanguage(cur.name, option, cur)] = cur.id;
			return pre;
		}, {});
		
		dispatch(pokemonNamesAndIdsLoaded(newNamesIds));
		dispatch(languageChanged(option));
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