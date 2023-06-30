import { createContext, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";

// prevent unnecessary re-renders of useNavigate from React Router.
// reference: https://github.com/remix-run/react-router/issues/7634
const RouterUtilsContext = createContext(null);

export default function RouterUtils({children}) {
	const navigate = useNavigate();
	const navigateRef = useRef(navigate);

	return (
		<RouterUtilsContext.Provider value={navigateRef}>
			{children}
		</RouterUtilsContext.Provider>
	)
};

export const useNavigateNoUpdates = () => {
	const navigateRef = useContext(RouterUtilsContext);
	if (navigateRef.current === null) {
		throw new Error('StableNavigate context is not initialized');
	};
	return navigateRef.current
};