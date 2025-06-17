import { Icon, IconProps } from '.'

function IconPlay(props: IconProps): JSX.Element {
  	return <Icon {...props}><svg viewBox="0 0 24 24"><circle stroke="currentColor" fill="currentColor" cx="12" cy="12" r="10"/><polygon strokeWidth={.5} points="10 8 16 12 10 16 10 8"/></svg></Icon>
}

export default IconPlay