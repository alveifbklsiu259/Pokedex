import './App.css';
import { createBrowserRouter,createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import RootRoute, { Index } from './components/RootRoute';
import Pokemon from './components/Pokemon';
import ErrorPage from './components/ErrorPage';

export const router = createBrowserRouter(createRoutesFromElements(
	<>
		<Route errorElement={<ErrorPage />} path="/" element={<RootRoute />}>
			<Route errorElement={<ErrorPage />}>
				<Route index element={<Index />} />
				<Route path="/pokemons/:pokeId" element={<Pokemon />} />
			</Route>
		</Route>
	</>
));

function App() {
	return (
		<RouterProvider router={router} />
	)
};

export default App;

// window.scrollTo(0,0) will be interrupted if you click the button right after the button shows up
// scrollResotration position not correct after: in pokemons, scroll down, click one pokemon, enter a wrong url, click back to pokeDex, the position will resotre to the previous scroll height, but i want it to stay on the top.

// preload
// checkbox for showing non-default-forms(mega/gmax) on root route
// show only mythical/legendart pokemons (species)
// why in my Pokemon component, when using Profiler, actualDuration is worse than baseDuration?

//---------------------------------------------------//
//Layout: (components)
/* 
1. search (name, id , types, reset button, optional(weakness, ability, height weight, location))
// implement the search as React Docs' search/ or advanced search (types show number like https://www.algolia.com/developers/)
1-2. advanced-search  // advanced search cause all pokemons to re-render???
2. filter section (sort by type, weight, number, height, generation, random pokemon, location, shape)
3. left navbar ( pokemons, berries )
----

// change generation to region, but have to fetch region data first.

// add show non-default-form checkbox,
// show mythical pokemons,
// show legendary pokemons
// check if there's function to cache in other components.
// for some reason React Data Table will have one extra re-render when mounts even though all the props passed to it are cached.
// east egg route
// theme using styled component
// map info
// favorite pokemons
// when chaing url directly in the url bar, the whole state gets re-set, this is not correct..., maybe we shoud localstorage the whole state?

// is it a good idea to move getDataToFetch into getData? // we can do that, but not urgent.
// translate height, weight, stat,
//A form field element should have an id or name attribute

	// when switching to redux, we can read state.display in Navbar to determin if we want to reset scroll position when click back to root.

	// can we use window.location to replace useParams?

	// in evolutionchain, see if we can put the right image , for example wooper has two chain, the second should be it's paldea form

by default, show all pokemons + infinite scroll or pagination, by filtering different generation, we still have infinite scroll or pagination

	// automatically submit when not typing // suspense?

sort by stat/colors/shapes

// useEffect cleanup function after fetching


/* 
Thoughts:
	1. create a dynamic condition function creator:
	say if you have a lot of conditions, you can just pass an array or object in, and also decide if you want || or &&, here're some examples:
	
		1. const filterData = ({ filters = [], every = false }) => (el) =>
		filters[every ? "every" : "some"]((filterFn) => filterFn(el));
		ref: https://stackoverflow.com/questions/65558221/javascript-multiple-condition-filtering-with-array-of-conditions

		2. const filterMoves = (method, version) => {
			const conditions = {
				move_learn_method: method,
				version_group: version
			};

			const test = versionDetail => Object.keys(conditions).every(key => {
				if (conditions[key] instanceof Array) {
					return conditions[key].some(condition => versionDetail[key].name === condition)
				} else {
					return conditions[key] === versionDetail[key].name;
				};
			})

			const matches = pokemonData.moves.filter(move => move.version_group_details.some(test));
			const results = matches.map(move => ({...move, version_group_details: move.version_group_details.filter(test)}));
			return results;
		};
		ref: https://bobbyhadz.com/blog/javascript-filter-array-multiple-conditions#filter-an-array-with-multiple-conditions-with-a-dynamic-filter

	2. Find a way to test client's connection speed, and based on the speed imply different fetching logic:
		e.g: There's a button that shows a table with different tabs taht can change displayed data, all the data is from the server,
		
		1. if the client's speed is slow, fetch the data only needed, for example: when the tab is clicked, the relevant data will be fetched, note this may have a bad UI if the client's speed is fast, because we will show a spinner or loading info when fetching data, that means between each displayed table the client will see a spinner/loading.
		2. if the cliente's speed is fast, fetch all the data when the show table button is clicked, this way, when the tab is clicked, we don't need to fetch data, therefore no loading/spinner between displayed table.

		ref: https://stackoverflow.com/questions/5529718/how-to-detect-internet-speed-in-javascript
*/