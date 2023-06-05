import { ScrollRestoration, Outlet } from "react-router-dom";
import Search from "./Search"
import Pokemons from "./Pokemons"

export default function RootRoute () {
	return (
		<>
			<ScrollRestoration getKey={location => {
				const paths = ["/"];
				return paths.includes(location.pathname) ? location.pathname : location.key;
			}}/>
			<Outlet />
		</>
	)
}

export function Index() {
	return (
		<>
			<div className="container mb-5">
				<Search />
				<Pokemons />
			</div>
		</>
	)
}