import React, { useState, memo, useCallback, type ReactElement } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Slide from '@mui/material/Slide';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import { advancedSearchReset } from '../features/search/searchSlice';
import { backToRoot, selectStatus } from '../features/display/displaySlice';
import { useNavigateNoUpdates } from './RouterUtils';
import LanguageMenu from '../features/display/LanguageMenu';
import Modal from './Modal';
import Search from '../features/search/Search';
import { useAppDispatch, useAppSelector } from '../app/hooks';

type HideOnScrollProps = {
	children: ReactElement
}

const HideOnScroll = ({children}: HideOnScrollProps) => {
	const trigger = useScrollTrigger();

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
					<Search onCloseModal={handleCloseModal}/>
				</Modal>
			)}
		</div>
	);
};

type MainBarProps = {
	setIsModalShown: React.Dispatch<React.SetStateAction<boolean>>
}

const MainBar = memo<MainBarProps>(function MainBar({setIsModalShown}) {
	const dispatch = useAppDispatch();
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
	const dispatch = useAppDispatch();
	const status = useAppSelector(selectStatus);
	const navigateNoUpdates = useNavigateNoUpdates();
	const handleBackToRoot = () => {
		dispatch(backToRoot());
		navigateNoUpdates('/');
	};

	return (
		<button className={`nav-btn ${status === 'loading' ? 'nav-btn-not-allowed' : ''}`} disabled={status === 'loading'} onClick={handleBackToRoot}>Pokedex</button>
	)
});