import { useEffect, useState, useRef } from "react"
import ball from '../assets/ball.svg'

export default function AdvancedSearch() {
	const [generationOptions, setGenerationOptions] = useState([]);
	const [types, setTypes] = useState([]);
	const ref = useRef(null);

	useEffect(() => {
		const getGeneration = async () => {
			const response = await fetch('https://pokeapi.co/api/v2/generation');
			const data = await response.json();
			setGenerationOptions(data.results)
		};
		getGeneration();
	}, [setGenerationOptions])

	useEffect(() => {
		const getTypes = async () => {
			const response = await fetch('https://pokeapi.co/api/v2/type');
			const data = await response.json();
			setTypes(data.results)
		};
		getTypes();
	}, [setTypes])

	const changeIcon = () => {
		if (ref.current.closest('button').getAttribute('aria-expanded') === 'true') {
			ref.current.classList.remove('fa-caret-down');
			ref.current.classList.add('fa-caret-up');
		} else {
			ref.current.classList.remove('fa-caret-up');
			ref.current.classList.add('fa-caret-down');
		};
	}

	return (
		<div className="advancedSearch text-center mt-3">
			<button type="button" data-bs-toggle="collapse" data-bs-target="#advanced_search" aria-expanded="false" aria-controls="advanced_search" onClick={changeIcon}>
				Show Advanced Search <i ref={ref} className="fa-solid fa-caret-down"></i>
			</button>
			<div className="collapse" id="advanced_search">
				<div className="container m-0 row justify-content-center">
					<ul className="generation col-12 col-sm-6 row justify-content-center gap-2">
						<div>
							<h3 ><img className="pokeBall" src={ball} alt="pokeBall" /> Generations</h3>
						</div>
						{generationOptions.map(generation => (
							<li key={generation.name} className="d-flex justify-content-center align-items-center">
								{(generation.name.replace('generation-', '')).toUpperCase()}
							</li>
						))}
					</ul>
					<ul className="typesFilter col-12 col-sm-6 row justify-content-center gap-2">
						<div>
							<h3 ><img className="pokeBall" src={ball} alt="pokeBall" /> Types</h3>
						</div>
						{types.filter(type => type.name !== 'unknown' && type.name !== 'shadow').map(type => (
							<li key={type.name} className={`type type-${type.name}`}>
								{type.name}
							</li>
						))}
					</ul>
							{/* reset button */}
				</div>
			</div>
		</div>
	)
}