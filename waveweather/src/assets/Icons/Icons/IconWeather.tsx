import weatherSvg from './weather.svg';


import { Icon } from '.'

function IconWeather(props): JSX.Element {
  return <Icon {...props}>
    <svg viewBox="0 0 64 64">
      <use href={`${weatherSvg}#${props.type}`} />
    </svg>
  </Icon>
}

export default IconWeather