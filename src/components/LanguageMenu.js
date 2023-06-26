import React, { useState, useEffect, useCallback } from 'react';
import { usePokemonData, useDispatchContenxt } from './PokemonsProvider';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const languageOptions = {
	en: 'English',
	ja: '日本語',
	zh_Hant: '正體中文 (繁體)',
	ko: '한국어'
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

	const changeLanguage = e => {
		handleClose();
		const selectedLanguage = Object.keys(languageOptions).find(option => languageOptions[option] === e.target.outerText);
		dispatch({type: 'languageChanged', payload: selectedLanguage});
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