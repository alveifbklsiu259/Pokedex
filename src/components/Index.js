import Search from "./Search"
import Pokemons from "./Pokemons"

export default function Index() {
	return (
		<div className="container mb-5">
			<Search />
			<Pokemons/>
		</div>
	)
}