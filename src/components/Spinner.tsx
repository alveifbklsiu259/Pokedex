import { memo } from 'react'
import spinner from '../assets/spinner.gif'

const Spinner = memo(function Spinner() {
	return (
		<div>
			<img
				src={spinner}
				alt="Loading..."
				className='spinner'
			/>
		</div>
	)
});

export default Spinner;