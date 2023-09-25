import { memo, type PropsWithChildren } from "react";
import { useNavigateToPokemon, usePrefetchOnNavigation } from "../api";
import type { GetRequiredData } from "../features/pokemonData/pokemonDataSlice";

type PrefetchOnNavigationPorps = {
	requestPokemonIds: number[],
	requests: GetRequiredData.Request[],
	customClass: string
}

const PrefetchOnNavigation = memo<PropsWithChildren<PrefetchOnNavigationPorps>>(function PrefetchOnNavigation({children, requestPokemonIds, requests, customClass}) {
	const navigateToPokemon = useNavigateToPokemon();
	const [unresolvedDataRef, prefetch] = usePrefetchOnNavigation();

	const handlePrefetch = () => {
		if (unresolvedDataRef.current === null) {
			prefetch(requestPokemonIds, requests);
		};
	};

	const handleClick = async() => {
		if (unresolvedDataRef.current) {
			navigateToPokemon(requestPokemonIds, requests, undefined, unresolvedDataRef.current);
		};
	};
	
	return (
		<div className={customClass}
			onClick={handleClick}
			onMouseEnter={handlePrefetch}
			onTouchStart={handlePrefetch}
		>
			{children}
		</div>
	)
});
export default PrefetchOnNavigation;