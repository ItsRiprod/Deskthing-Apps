import { Icon } from '.'

function IconPlay(props): JSX.Element {
	return <Icon {...props}><svg viewBox="0 0 24 24"><circle stroke="white" fill="white" cx="12" cy="12" r="10"/><line strokeWidth={1.5} x1="10" x2="10" y1="16" y2="7"/><line strokeWidth={1.5} x1="14" x2="14" y1="16" y2="7"/></svg></Icon>
}

export default IconPlay