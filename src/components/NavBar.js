import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LanguageMenu from './LanguageMenu';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Slide from '@mui/material/Slide';
import { useDispatchContenxt } from './PokemonsProvider';
import Modal from './Modal';
import Search from './Search';


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

// change language logic
// go back to top after search

export default function NavBar() {
	const [isModalShown, setIsModalShown] = useState(false);
	const dispatch = useDispatchContenxt();
	const showModal = () => {
		setIsModalShown(true);
		dispatch({type: 'advancedSearchReset'});
	}

	const closeModal = () => {
		setIsModalShown(false);
	};

	const backToRoot = () => {
		dispatch({type: 'backToRoot'})
	}

	// return (
	// 	<div className='navbar'>
	// 		<Box sx={{ flexGrow: 1, mb: 9 }}>
	// 			<HideOnScroll>
	// 				<AppBar sx={{bgcolor: theme => theme.palette.primary.light, position: 'fixed'}}>
	// 					<Toolbar sx={{justifyContent: 'space-between'}}>
	// 					<Typography variant="h5" component={Link} to="/" color="#fff" onClick={backToRoot}>Pokédex</Typography>
	// 					<Box sx={{display: 'flex'}}>
	// 						<Button size='large' variant="contained" onClick={showModal}><i className="fa-solid fa-magnifying-glass"></i></Button>
	// 						<LanguageMenu />
	// 					</Box>
	// 					</Toolbar>
	// 				</AppBar>
	// 			</HideOnScroll>
	// 		</Box>
	// 		<Modal 
	// 			isModalShown={isModalShown} 
	// 			setIsModalShown={setIsModalShown}
	// 			customClass='modalBody searchModal'
	// 		>
	// 			<Search closeModal={closeModal}/>
	// 		</Modal>
	// 	</div>
	// );
}