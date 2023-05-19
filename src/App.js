import './App.css';
import { createBrowserRouter,createRoutesFromElements, Route, RouterProvider, Routes} from 'react-router-dom';
import PokemonsProvider from './components/PokemonsProvider';
import Index from './components/Index';
import Pokemon from './components/Pokemon';

const router = createBrowserRouter(createRoutesFromElements(
  <>
    <Route path="/" element={<Index />}/>
    <Route path="/pokemons/:pokeId" element={<Pokemon />}/>
  </>
))


function App() {
  return (
    <PokemonsProvider>
      <RouterProvider router={router} />
    </PokemonsProvider>
  );
}

export default App;


// pokedex
// change language
// pagination
// manual cache

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

