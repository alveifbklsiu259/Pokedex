import ball from '../assets/ball.svg'
import { useState, useEffect } from 'react'

export default function FilterGeneration() {
	const [generationOptions, setGenerationOptions] = useState([]);
	const handleSelect = (e,generation) => {
		e.target.classList.toggle('selected')
		console.log(generation)
	}
	useEffect(() => {
		const getGeneration = async () => {
			const response = await fetch('https://pokeapi.co/api/v2/generation');
			const data = await response.json();
			setGenerationOptions(data.results)
		};
		getGeneration();
	}, [setGenerationOptions])


	return (
		<ul className="generation col-12 col-sm-6 row justify-content-center gap-2">
			<div>
				<h3 ><img className="pokeBall" src={ball} alt="pokeBall" /> Generations</h3>
			</div>
			{generationOptions.map(generation => (
				<li onClick={(e) => handleSelect(e, generation)} key={generation.name} className="d-flex justify-content-center align-items-center">
					{(generation.name.replace('generation-', '')).toUpperCase()}
				</li>
			))}
		</ul>
	)
}