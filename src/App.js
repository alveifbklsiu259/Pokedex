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
1-2. advanced-search
2. filter section (sort by type, weight, number, height, generation, random pokemon, location, shape)
3. left navbar ( pokemons, berries ) 
4. pokemons (index page, by default show all the pokemons in gen 1)  /  option B: show a certain amount of pokemons + pagination // pokemon varieties(when filter by generation or regin will be filtered out)  ******** my pokemons component seems like re-render 1** times..
5. pokemon (each pokemon, image, name, ide, types) (different imgs fron differ gen)
6. pokemonInfo ( moves, species, height,weight evolution, abilities, stat...), button to next and previous pokmon
7. loader

----
api:
pokemons: all pokemon entries (name, types, images)

pokemon: pokemons species, if i can cache the pokemons api result, i don't have to make another request



*/

