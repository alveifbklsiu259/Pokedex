import { useEffect, useRef, useState, memo, useCallback } from "react";

const ScrollToTop = memo(function ScrollToTop() {
	const [isBtnShown, setIsBtnShown] = useState(false);
	const lastScrollTop = useRef(document.documentElement.scrollTop);

	const showBtn = useCallback(() => {
		const currentScrollTop = document.documentElement.scrollTop;
		if (currentScrollTop < lastScrollTop.current && currentScrollTop > 300) {
			// scroll up
			setIsBtnShown(true);
		} else if (currentScrollTop > lastScrollTop.current || currentScrollTop < 300) {
			// scroll down
			setIsBtnShown(false);
		};
		lastScrollTop.current = currentScrollTop;
	}, [lastScrollTop, setIsBtnShown]);

	useEffect(() => {
		window.addEventListener('scroll', showBtn);
		return () => window.removeEventListener('scroll', showBtn);
	}, [showBtn]);

	const handleScrollToTop = () => {
		if (isBtnShown) {
			window.scrollTo(0, 0);
		};
	};

	return (
		<>
			<i onClick={handleScrollToTop} className={`fa-solid fa-angle-up fa-bounce upBtn ${!isBtnShown ? 'upBtnHide' : ''}`}></i>
		</>
	)
});

export default ScrollToTop;