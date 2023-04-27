import { useEffect, useState } from "react"

export default function BasicInfo({testId}) {
    const [data, setData] = useState({})
   
    useEffect(()=>{
        const getInfo = async () => {
            const response = await fetch('https://pokeapi.co/api/v2/pokemon-species/1');
            const data = await response.json();
            setData(data)
        };
        getInfo()
    }, [])



	return (
		<>
			<div className='basic-info row col-12 col-sm-6 justify-content-center'>
                <img className="poke-img mx-auto p-0 w-50" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${testId}.png`} alt="Bulbizarre" />
                <div className="p-0 row text-center">
                    <span className="p-0">#000{data.id}</span>
                    <h1 className="p-0 text-capitalize">{data.name}</h1>
                    <div className="types p-0 d-flex justify-content-center">
                        <span className="type-grass">Grass</span>
                        <span className="type-poision">Poision</span>
                    </div>
                </div>
            </div>
		</>
	)
}