import './App.css';
import { createBrowserRouter,createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import PokemonsProvider from './components/PokemonsProvider';
import RootRoute, { Index } from './components/RootRoute';
import Pokemon from './components/Pokemon';
import ErrorPage from './components/ErrorPage';


const router = createBrowserRouter(createRoutesFromElements(
	<>	
		<Route errorElement={<ErrorPage />} path="/" element={<RootRoute />}>
			<Route errorElement={<ErrorPage />}>
				<Route index element={<Index />} />
				<Route path="/pokemons/:pokeId" element={<Pokemon /> } />
			</Route>
		</Route>
	</>
));

function App() {
	return (
		<PokemonsProvider>
			<RouterProvider router={router} />
		</PokemonsProvider>
	)
};

export default App;

// window.scrollTo(0,0) will be interrupted if you click the button right after the button shows up
// scrollResotration position not correct after: in pokemons, scroll down, click one pokemon, enter a wrong url, click back to pokeDex, the position will resotre to the previous scroll height, but i want it to stay on the top.

// cache types, generations as in basic info or...
// pokedex
// change language
// manual cache
// next/previous pokemon on pokemon page / or use fullPage.js
// ability modal
// pokemon different forms tab, in Pokemons, have a checkbox to show different forms
// evolution details
// why in my Pokemon component, when using Profiler, actualDuration is worse than baseDuration?


//---------------------------------------------------//
//Layout: (components)
/* 
1. search (name, id , types, reset button, optional(weakness, ability, height weight, location))
// implement the search as React Docs' search/ or advanced search (types show number like https://www.algolia.com/developers/)
1-2. advanced-search  // advanced search cause all pokemons to re-render???
2. filter section (sort by type, weight, number, height, generation, random pokemon, location, shape)
3. left navbar ( pokemons, berries ) 
4. pokemons (index page, by default show all the pokemons in gen 1)  /  option B: show a certain amount of pokemons + pagination or infinite scroll // pokemon varieties(when filter by generation or region will be filtered out)  
5. pokemon (each pokemon, image, name, ide, types) (different imgs fron differ gen)
6. pokemonInfo ( moves, species, height,weight evolution, abilities, stat...), button to next and previous pokmon
7. loader
8. error page
9. go up button
----
by default, show all pokemons + infinite scroll or pagination, by filtering different generation, we still have infinite scroll or pagination

	// automatically submit when not typing // suspense?

sort by stats/colors/shapes
		add forms
		numbers starting 10000 are different form, should not appear on the pokedex, and when click them to their page will have an error
		if we go direct to /pokemons/999, since we don't have data in our pokemons state, we want to do individual fetch
		some poekons don't have flavor text (999...)
		// advanced show differnt forms on pokemons page or not
api:
// useEffect cleanup function after fetching
// some pokemons have multiple same abilities

pokemons: all pokemon entries (name, types, images)
// I want to show pokemon options when searching, but that may require all pokemons being fetched.
// see if there's any way to prefetch
// when you go to individual pokemon's page the second time, why is the offset weird?
// No Pokémons to show problem
//new tab will not render correctly???
// when scrilling down, I think it's because of the loader component, it causes unnecess re-render of pokemons component.
// 268 evolution chain error



pokemon: pokemons species, if i can cache the pokemons api result, i don't have to make another request



*/

