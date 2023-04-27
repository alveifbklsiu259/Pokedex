import pokeBall from '../assets/pokeBall.png'

export default function Search() {

    return (
        <div style={{background: 'blanchedalmond'}} className="card-body mb-4 p-4">
            <h1  className="display-4 text-center">
                <img style={{width: '10%'}} src={pokeBall} alt="pokeBall" /> Search For Pokemons
            </h1>
            <p className="lead text-center">By Name or the National Pokédex number</p>
            <form >
                <div className="form-group">
                    <input type="text" className="form-control form-control-lg" placeholder="Name or the National Pokédex number..." name="searchResult" />
                </div>
                <button className="btn btn-primary btn-lg btn-block w-100 mt-3 mb-5" type="submit">Search</button>
            </form>
        </div>  
    )
}