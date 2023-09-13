import { createContext, useContext, useRef, useMemo, type ReactNode, PropsWithChildren } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";

// prevent unnecessary re-renders of useNavigate from React Router.
// reference: https://github.com/remix-run/react-router/issues/7634
// you can also try this method: https://github.com/remix-run/react-router/issues/7634#:~:text=ryanflorence%20commented%20on%20Nov,edited
type RouterUtilsContextType = {
	navigateRef: React.MutableRefObject<NavigateFunction> | null;
};

const RouterUtilsContext = createContext<RouterUtilsContextType>({
	navigateRef: null
});

type RouterUtilsProps = {
	children: ReactNode
};

export default function RouterUtils({children}: RouterUtilsProps) {
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
	if (navigateRef === null) {
		throw new Error('StableNavigate context is not initialized');
	};
	return navigateRef.current;
};