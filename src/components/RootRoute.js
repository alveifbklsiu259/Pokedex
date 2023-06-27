import { ScrollRestoration, Outlet } from "react-router-dom";
import Search from "./Search";
import Pokemons from "./Pokemons";
import NavBar from "./NavBar";

export default function RootRoute () {
	return (
		<>
			<ScrollRestoration getKey={location => {
				const paths = ["/"];
				return !paths.includes(location.pathname) || location.state === 'backToRoot' ? location.key : location.pathname;
			}}/>
			<NavBar />
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