import { ScrollRestoration, Outlet } from "react-router-dom";
import RouterUtils from "./RouterUtils";
import Search from "../features/search/Search";
import Pokemons from "../features/pokemonData/Pokemons";
import NavBar from "./NavBar";

export default function RootRoute () {
	return (
		<RouterUtils>
			<ScrollRestoration getKey={location => {
				const paths = ["/"];
				return !paths.includes(location.pathname) || location.state === 'resetPosition' ? location.key : location.pathname;
			}}/>
			<NavBar />
			<Outlet />
		</RouterUtils>
	)
};

export function Index() {
	return (
		<>
			<div className="container mb-5">
				<Search />
				<Pokemons />
			</div>
		</>
	)
};