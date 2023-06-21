import spinner from '../assets/spinner.gif'

export default function Spinner() {
	return (
		<div>
			<img
				src={spinner}
				alt="Loading..."
				className='spinner'
			/>
		</div>
	)
}