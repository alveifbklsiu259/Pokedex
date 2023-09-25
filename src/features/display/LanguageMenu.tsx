import React, { useState, useEffect, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { selectLanguage, changeLanguage } from './displaySlice';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export const languageOptions = {
	en: 'English',
	ja: '日本語',
	zh_Hant: '繁體中文',
	zh_Hans: '简体中文',
	ko: '한국어',
	fr: 'Français',
	de: 'Deutsch',
};

// how to make all the type of each properties in languageOptions its own key?

type AnchorElTypes = null | HTMLButtonElement;

const LanguageMenu = memo(function LanguageMenu() {
	const [anchorEl, setAnchorEl] = useState<AnchorElTypes>(null);
	const open = Boolean(anchorEl);
	const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		setAnchorEl(e.currentTarget);
	};

	const handleClose = useCallback(() => {
		setAnchorEl(null);
	}, [setAnchorEl]);

	useEffect(() => {
		window.addEventListener('scroll', handleClose);
		return () => {
			window.removeEventListener('scroll', handleClose);
		};
	}, [handleClose]);

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
				onClick={e => handleClick(e)}
			>
				<i className="fa-solid fa-language"></i>
			</Button>
			{open && (
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
						<Item 
							key={option}
							option={option as keyof typeof languageOptions}
							handleClose={handleClose}
						/>
					))}
				</Menu>
			)}
		</div>
	);
});

type ItemProprs = {
	option: keyof typeof languageOptions,
	handleClose: () => void;
}

const Item = memo(function Item({option, handleClose}: ItemProprs) {
	const dispatch = useAppDispatch();
	const language = useSelector(selectLanguage);
	const {pokeId} = useParams();

	const handleChangeLanguage = () => {
		handleClose();
		dispatch(changeLanguage({option, pokeId}));
	};

	return (
		<MenuItem
			sx={{
				mx: 1,
				my: 0.4,
				borderRadius: 2,
				'&.Mui-disabled': {
					opacity: 1
				}
			}}
			selected={option === language ? true : false}
			onClick={handleChangeLanguage}
		>
			{languageOptions[option]}
		</MenuItem>
	)
});

export default LanguageMenu;