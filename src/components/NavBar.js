import React, { useState, memo } from 'react';
import { useDispatch } from 'react-redux';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import { advancedSearchReset } from '../features/search/searchSlice';
import { backToRoot } from '../features/display/displaySlice';
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

	const handleCloseModal = () => {
		setIsModalShown(false);
	};

	return (
		<div className='navbar'>
			<SearchBtn setIsModalShown={setIsModalShown}/>
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

const SearchBtn = memo(function SearchBtn({setIsModalShown}) {
	const dispatch = useDispatch();
	const navigateNoUpdates = useNavigateNoUpdates();

	const handleShowModal = () => {
		setIsModalShown(true);
		dispatch(advancedSearchReset());
	};

	const handleBackToRoot = () => {
		dispatch(backToRoot());
		navigateNoUpdates('/');
	};
	
	return (
		<Box sx={{ flexGrow: 1, mb: 9 }}>
			<HideOnScroll>
				<AppBar sx={{bgcolor: theme => theme.palette.primary.light, position: 'fixed'}}>
					<Toolbar sx={{justifyContent: 'space-between'}}>
					<Typography variant="h5" color="#fff" sx={{cursor: 'pointer'}} onClick={handleBackToRoot}>Pokédex</Typography>
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