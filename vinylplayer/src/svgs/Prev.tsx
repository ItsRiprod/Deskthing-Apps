import { Icon, IconProps } from '.'

function IconPrev(props: IconProps): JSX.Element {
	return <Icon {...props}><svg viewBox="0 0 24 24"><polygon stroke="currentColor" fill="currentColor" points="19 20 9 12 19 4 19 20"/><line stroke="currentColor" fill="currentColor" x1="5" x2="5" y1="19" y2="5"/></svg></Icon>
}

export default IconPrev