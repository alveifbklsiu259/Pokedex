
import BasicInfo from "./BasicInfo"
import { usePokemonData } from "./PokemonsProvider"
import { Link, useParams } from "react-router-dom"
import { useState, useEffect } from "react"

export default function Pokemon() {
    const {dispatch, state} = usePokemonData();
    const [data, setData] = useState({})
    const [data2, setData2] = useState({})
    const [data3, setData3] = useState({})
    useEffect(()=>{
        const getInfo = async () => {
            const response = await fetch('https://pokeapi.co/api/v2/pokemon-species/1');
            const data = await response.json();
            setData(data)
            console.log(data)
            const response2 = await fetch('https://pokeapi.co/api/v2/pokemon/1');
            const data2 = await response2.json();
            setData2(data2)
            console.log(data2)
            if (data.evolution_chain?.url) {
                const response3 = await fetch(data.evolution_chain.url);
                const data3 = await response3.json();
                setData3(data3)
                console.log(data3.chain)
            }
        };
        getInfo()
    }, [])

    console.log(state.pokemons)
    const {pokeId} = useParams();
    console.log(pokeId)
    
    return (
        <>
            <div className="container p-0">
                <div className="row justify-content-center">
                    {/* Basic info */}
                        <BasicInfo pokemon={state.pokemons[pokeId - 1]}/>
                        <div className='basic-info row col-12 col-sm-6 justify-content-center'>
                            <img className="poke-img mx-auto p-0 w-50" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png`} alt="Bulbizarre" />
                            <div className="p-0 row text-center">
                                <span className="p-0">#000{data.id}</span>
                                <h1 className="p-0 text-capitalize">{data.name}</h1>
                                <div className="types p-0 d-flex justify-content-center">
                                    <span className="type-grass">Grass</span>
                                    <span className="type-poison">Poision</span>
                                    {/* make types its own component */}
                                </div>
                            </div>
                        </div>
                        
                    {/* detail */}
                    <div className="detail row text-center col-12 col-sm-6">
                        <p className="my-4 col-6">Height <br />  <span>{data2.height * 10 } cm</span></p>
                        <p className="my-4 col-6">Weight <br /> <span>{data2.weight * 100 / 1000 } kg</span></p>
                        <p className="col-6">Gender <br />
                        <span><i className="fa-solid fa-mars"></i> <i className="fa-solid fa-venus"></i></span>
                        </p>
                        <p className="col-6">Abilities <br /><span>chlorophyll</span><br /><span>overgrow</span></p>
                        <p className="col-12 m-3 p-2 text-start description">{(data?.flavor_text_entries && data?.flavor_text_entries[0].flavor_text) ? data?.flavor_text_entries[0].flavor_text : ''}</p>
                    </div>
                    
                    {/* stats */}
                                        
                    <div className="col-12 mt-5 stats">
                        <h1 className="text-center" >Stats</h1>
                        <table className="mx-auto">
                            <tbody>
                                {data2.stats ? data2.stats.map(stat => (
                                    <tr key={stat.stat.name}>
                                        <td className='text-capitalize' width='30%'> {stat.stat.name}</td>
                                        <td width='10%'>{stat.base_stat}</td>
                                        {/* <td width='255px'>
                                            <div style={{borderTop: '3px solid salmon', width: `${stat.base_stat / 255 * 100}%`}}></div>
                                        </td> */}
                                        <td width='255px'>
                                            <div className="stat-bar-bg">
                                                <div className={`stat-bar stat-${stat.stat.name}`} style={{width: `${stat.base_stat / 255 * 100}%`}}></div>
                                            </div>
                                        </td>
                                    </tr>
                                )) : null}
                                <tr>
                                    <td style={{fontSize: 'bold'}}>Total</td>
                                    <td>{ data2.stats ? data2.stats.reduce((accumulator, currentVal) => accumulator + currentVal.base_stat, 0) : null}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* evolution */}
                    <div className="col-12 mt-5">
                        <h1 className="text-center">Evolutions</h1>
                        <ul className="p-0 m-0 mx-auto">
                            <li>
                            {/* <BasicInfo testId={1} /> */}
                            </li>
                            <li>
                            {/* <BasicInfo testId={2} /> */}
                            </li>
                            <li>
                            {/* <BasicInfo testId={3} /> */}
                            </li>
                        </ul>
                    </div>

                    {/* Button */}
                    <div className="row justify-content-center">
                        <a className="w-50 m-3 btn btn-block btn-secondary">Explore More Pokemons</a>
                    </div>
                </div>

            </div>
        </>
    )
}