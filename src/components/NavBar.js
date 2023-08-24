import React, { useState, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import { advancedSearchReset } from '../features/search/searchSlice';
import { backToRoot, selectStatus } from '../features/display/displaySlice';
import { useNavigateNoUpdates } from './RouterUtils';
import LanguageMenu from '../features/display/LanguageMenu';
import Modal from './Modal';
import Search from '../features/search/Search';

const HideOnScroll = (props) => {
	const { children, window } = props;
	const trigger = useScrollTrigger({
		target: window ? window() : undefined,
	});

	return (
		<Slide appear={false} direction="down" in={!trigger}>
			{children}
		</Slide>
	);
};

export default function NavBar() {
	const [isModalShown, setIsModalShown] = useState(false);

	const handleCloseModal = useCallback(() => {
		setIsModalShown(false);
	}, [setIsModalShown]);

	return (
		<div className='navbar'>
			<MainBar setIsModalShown={setIsModalShown}/>
			{isModalShown && (
				<Modal
					isModalShown={isModalShown}
					setIsModalShown={setIsModalShown}
					customClass='modalBody searchModal'
				>
					<Search closeModal={handleCloseModal}/>
				</Modal>
			)}
		</div>
	);
};

const MainBar = memo(function MainBar({setIsModalShown}) {
	const dispatch = useDispatch();
	const handleShowModal = () => {
		setIsModalShown(true);
		dispatch(advancedSearchReset());
	};
	
	return (
		<Box sx={{ flexGrow: 1, mb: 9 }}>
			<HideOnScroll>
				<AppBar sx={{bgcolor: theme => theme.palette.primary.light, position: 'fixed'}}>
					<Toolbar sx={{justifyContent: 'space-between'}}>
					<BackToRootBtn />
					<Box sx={{display: 'flex'}}>
						<Button size='large' variant="contained" onClick={handleShowModal}>
							<i className="fa-solid fa-magnifying-glass"></i>
						</Button>
						<LanguageMenu />
					</Box>
					</Toolbar>
				</AppBar>
			</HideOnScroll>
		</Box>
	)
});

const BackToRootBtn = memo(function BackToRootBtn() {
	const dispatch = useDispatch();
	const status = useSelector(selectStatus);
	const navigateNoUpdates = useNavigateNoUpdates();
	const handleBackToRoot = () => {
		dispatch(backToRoot());
		navigateNoUpdates('/');
	};

	return (
		<button className={`nav-btn ${status === 'loading' ? 'nav-btn-not-allowed' : ''}`} disabled={status === 'loading'} onClick={handleBackToRoot}>Pokédex</button>
	)
});