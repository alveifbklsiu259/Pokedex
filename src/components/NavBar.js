import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import LanguageMenu from './LanguageMenu';
import Modal from './Modal';
import Search from './Search';
import { useDispatch } from 'react-redux';
import { advancedSearchReset, backToRoot } from '../features/pokemonData/pokemonDataSlice';

function HideOnScroll(props) {
	const { children, window } = props;
	const trigger = useScrollTrigger({
	  target: window ? window() : undefined,
	});
  
	return (
	  <Slide appear={false} direction="down" in={!trigger}>
		{children}
	  </Slide>
	);
}

export default function NavBar() {
	const [isModalShown, setIsModalShown] = useState(false);
	const dispatch = useDispatch();
	const onShowModal = () => {
		setIsModalShown(true);
		dispatch(advancedSearchReset());
	};

	const onCloseModal = () => {
		setIsModalShown(false);
	};

	const onBackToRoot = () => {
		dispatch(backToRoot())
	};

	return (
		<div className='navbar'>
			<Box sx={{ flexGrow: 1, mb: 9 }}>
				<HideOnScroll>
					<AppBar sx={{bgcolor: theme => theme.palette.primary.light, position: 'fixed'}}>
						<Toolbar sx={{justifyContent: 'space-between'}}>
						<Typography variant="h5" component={Link} to="/" color="#fff" onClick={onBackToRoot}>Pokédex</Typography>
						<Box sx={{display: 'flex'}}>
							<Button size='large' variant="contained" onClick={onShowModal}><i className="fa-solid fa-magnifying-glass"></i></Button>
							<LanguageMenu />
							{/* see if we can disable pokedex link when loading */}
						</Box>
						</Toolbar>
					</AppBar>
				</HideOnScroll>
			</Box>
			{isModalShown && (
				<Modal
					isModalShown={isModalShown}
					setIsModalShown={setIsModalShown}
					customClass='modalBody searchModal'
				>
					<Search closeModal={onCloseModal}/>
				</Modal>
			)}
		</div>
	);
}