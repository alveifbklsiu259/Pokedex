import './App.css';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import RootRoute, { Index } from './components/RootRoute';
import Pokemon from './features/pokemonData/Pokemon';
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