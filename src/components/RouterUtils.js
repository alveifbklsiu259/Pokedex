import { createContext, useContext, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// prevent unnecessary re-renders of useNavigate from React Router.
// reference: https://github.com/remix-run/react-router/issues/7634
// you can also try this method: https://github.com/remix-run/react-router/issues/7634#:~:text=ryanflorence%20commented%20on%20Nov,edited
const RouterUtilsContext = createContext(null);

export default function RouterUtils({children}) {
	const navigate = useNavigate();
	const navigateRef = useRef(navigate);

	const contextValue = useMemo(() => ({navigateRef}), [navigateRef])

	return (
		<RouterUtilsContext.Provider value={contextValue}>
			{children}
		</RouterUtilsContext.Provider>
	)
};

export const useNavigateNoUpdates = () => {
	const {navigateRef} = useContext(RouterUtilsContext);
	if (navigateRef.current === null) {
		throw new Error('StableNavigate context is not initialized');
	};
	return navigateRef.current;
};