import pokeBall from '../assets/pokeBall.png'
import { usePokemonData } from './PokemonsProvider'
import { useState, useEffect } from 'react';
import AdvancedSearch from './AdvancedSearch';

export default function Search() {
	const { dispatch, state } = usePokemonData();
	const [searchParam, setSearchParam] = useState('');
	const param = state.searchParam
	useEffect(() => {
		setSearchParam(param)
	}, [param])

	const handleSearch = (e) => {
		e.preventDefault();
		dispatch({type: 'searchParamChanged', payload: searchParam})
	}

	return (
		<div style={{background: 'blanchedalmond'}} className="card-body mb-4 p-4">
			<h1  className="display-4 text-center">
				<img style={{width: '10%'}} src={pokeBall} alt="pokeBall" /> Search For Pokémons
			</h1>
			<p className="lead text-center">By Name or the National Pokédex number</p>
			<form onSubmit={(e) => handleSearch(e)}>
				<div className="form-group">
					<input type="text" className="form-control form-control-lg" placeholder="Name or the National Pokédex number..." name="searchResult" value={searchParam} onChange={e => setSearchParam(e.target.value)} />
				</div>
				<AdvancedSearch />
				<button className="btn btn-primary btn-lg btn-block w-100 mt-3 mb-5" type="submit">Search</button>
			</form>
		</div>
	)
}