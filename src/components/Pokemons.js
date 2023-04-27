import { useEffect, useState } from "react"
import '../api'

export default function Pokemons() {
    const [pokemons, setPokemons] = useState({})
    // useEffect(() => {
    //     const getPokemons = async () => {
    //         const response = await fetch('https://pokeapi.co/api/v2/pokemon/1');
    //         const data = await response.json();
    //         setPokemons(data.pokemon_species)
    //         console.log(data)

    //     };
    //     getPokemons();
    // }, [setPokemons])
    // useEffect(() => {
    //     const getPokemons = async() => {
	// 		const obj = {};
    //         const response = await fetch('https://pokeapi.co/api/v2/pokemon/?limit=151');
	// 		const data = await response.json();
	// 		await Promise.all(data.results.map(entry => fetch(`https://pokeapi.co/api/v2/pokemon/${entry.name}/`)))
	// 		.then(results => results.map(result => result.json()))
	// 		.then(dataPromises => Promise.all(dataPromises))
	// 		.then(data => data.map((data, i) => {
	// 			obj[i] = {}
	// 			obj[i].name = data.name
	// 			obj[i].img = data.sprites.other['official-artwork'].front_default
	// 			obj[i].types = [];
	// 			for (let {type:{name}} of data.types) {
	// 				obj[i].types.push(name)
	// 			};
	// 		}));
	// 		setPokemons(obj)
    //     };
    //     getPokemons()
    // }, [])

	

    let content;
    let arr = [];
    for (let i = 1; i <= 151; i++) {
        arr.push(i)
    }


    return (
        <>
            <div className="container">
                <div className="row g-5">
                {/* {   arr.map(item => (
                    <div key={item} className="col-6 col-md-4 col-lg-3 card pb-3">
                    <a href="#">
                        <img className="w-100" src={pokemons[item]?.img} alt="Bulbizarre" />
                        <p className="id">{`#${item}`}</p>
                        <h2 className="name">{pokemons[item]?.name}</h2>
                        <div className="types">
							{pokemons?.types?.map(type => {
								return (
								<span className={type}>{type}</span>
							)})}
                            
                        </div>
                    </a>
                </div> 
                ))} */}
				     {   arr.map(item => (
                    <div key={item} className="col-6 col-md-4 col-lg-3 card pb-3">
                    <a href="#">
                        <img className="w-100" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${item}.png`} alt="Bulbizarre" />
                        <p className="id">{`#${item}`}</p>
                        <h2 className="name">Bulbizarre</h2>
                        <div className="types">
							<span className="type-grass">Grass</span>
							<span className="type-poision">Poision</span>
                        </div>
                    </a>
                </div> 
                ))}


                    {/* <div className="col-md-3 card pb-3">
                        <a href="#">
                            <img className="w-100" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" alt="Bulbizarre" />
                            <p className="id">#0001</p>
                            <h2 className="name">Bulbizarre</h2>
                            <div className="types">
                                <span className="grass">Grass</span>
                                <span className="poision">Poision</span>
                            </div>
                        </a>
                    </div> */}
                    
                </div>
            </div>
            
        </>
    )
}