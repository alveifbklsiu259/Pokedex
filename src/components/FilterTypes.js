import ball from '../assets/ball.svg'
import { useState, useEffect } from 'react'

export default function FilterTypes() {
	const [types, setTypes] = useState([]);
	const handleSelect = (e) => {
		e.target.classList.toggle('selected')
	}
    
    useEffect(() => {
		const getTypes = async () => {
			const response = await fetch('https://pokeapi.co/api/v2/type');
			const data = await response.json();
			setTypes(data.results)
		};
		getTypes();
	}, [setTypes])

    return (
        <ul className="typesFilter col-12 col-sm-6 row justify-content-center gap-3">
			<div>
				<h3 ><img className="pokeBall" src={ball} alt="pokeBall" /> Types</h3>
			</div>
			{types.filter(type => type.name !== 'unknown' && type.name !== 'shadow').map(type => (
				<li onClick={(e) => handleSelect(e)} key={type.name} className={`type type-${type.name}`}>
					{type.name}
				</li>
			))}
		</ul>
    )
}