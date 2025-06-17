import { Icon } from '.'

function IconRepeat(props): JSX.Element {
	return (
		<Icon {...props}>
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
			>
				<path d="m17 2 4 4-4 4"/>
				<path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
				<path d="m7 22-4-4 4-4"/>
				<path d="M21 13v1a4 4 0 0 1-4 4H3"/>
			</svg>
		</Icon>
	)
}

export default IconRepeat
