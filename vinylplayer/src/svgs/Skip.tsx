import { Icon, IconProps } from '.'

function IconSkip(props: IconProps): JSX.Element {
	return <Icon {...props}><svg viewBox="0 0 24 24"><polygon stroke="currentColor" fill="currentColor" points="5 4 15 12 5 20 5 4"/><line stroke="currentColor" fill="currentColor" x1="19" x2="19" y1="5" y2="19"/></svg></Icon>
}

export default IconSkip