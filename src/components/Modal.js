export default function Modal({customClass, isModalShown, setIsModalShown, setIsDetail, children}) {

	const handleCloseModal = () => {
		setIsModalShown(false);
		if (setIsDetail) {
			setIsDetail(false);
		};
	};

	const handlePropagation = (e) => {
		e.stopPropagation();
	};

	return (
		<>
			<div className={`modalBg ${isModalShown ? 'showModal' : 'hideModal'}`} onClick={handleCloseModal}>
				<div className={customClass} onClick={handlePropagation}>
					<div className='modalTop'>
						<i className="fa-solid fa-xmark xmark me-3 my-2" onClick={handleCloseModal}></i>
					</div>
					{children}
				</div>
			</div>
		</>
	)
}