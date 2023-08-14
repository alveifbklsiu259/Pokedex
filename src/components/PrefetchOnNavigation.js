import { memo } from "react";
import { useNavigateToPokemon, usePrefetchOnNavigation } from "../api";

const PrefetchOnNavigation = memo(function PrefetchOnNavigation({children, requestPokemonIds, requests, customClass}) {
	const navigateToPokemon = useNavigateToPokemon();
	const [unresolvedDataRef, prefetch] = usePrefetchOnNavigation();

	const handleMouseEnter = () => {
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
			onMouseEnter={handleMouseEnter}
		>
			{children}
		</div>
	)
});
export default PrefetchOnNavigation;