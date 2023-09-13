import { useEffect, useRef, useState, memo } from "react";

const ScrollToTop = memo(function ScrollToTop() {
	const [isBtnShown, setIsBtnShown] = useState(false);
	const lastScrollTop = useRef(document.documentElement.scrollTop);

	useEffect(() => {
		window.addEventListener('scroll', showBtn);
		return () => window.removeEventListener('scroll', showBtn);
	}, []);

	const scrollToTop = () => {
		if (isBtnShown) {
			window.scrollTo(0, 0);
		};
	};

	const showBtn = () => {
		const currentScrollTop = document.documentElement.scrollTop;
		if (currentScrollTop < lastScrollTop.current && currentScrollTop > 300) {
			// scroll up
			setIsBtnShown(true);
		} else if (currentScrollTop > lastScrollTop.current || currentScrollTop < 300) {
			// scroll down
			setIsBtnShown(false);
		};
		lastScrollTop.current = currentScrollTop;
	};

	return (
		<>
			<i onClick={scrollToTop} className={`fa-solid fa-angle-up fa-bounce upBtn ${!isBtnShown ? 'upBtnHide' : ''}`}></i>
		</>
	)
});

export default ScrollToTop;