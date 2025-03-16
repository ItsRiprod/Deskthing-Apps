import { SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  iconSize?: number;
  strokeWidth?: number;
  stroke?: string;
  color?: string;
  title?: string;
  titleId?: string;
  desc?: string;
  descId?: string;
  className?: string;
  fill?: string;
  children?: React.ReactNode;
}

export const Icon = ({
  iconSize = 24,
  color = "currentColor",
  title,
  titleId,
  desc,
  stroke="currentColor",
  fill = 'currentColor',
  descId,
  strokeWidth = 1,
  className,
  width = iconSize,
  height = iconSize,
  children,
  ...restProps
}: IconProps): JSX.Element => {
  return (
    <svg
      color={color}
      role="img"
      height={height}
      fill={fill}
      stroke={stroke}
      width={width}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      strokeWidth={strokeWidth}
      {...restProps}
    >
      {title && <title id={titleId}>{title}</title>}
      {desc && <desc id={descId}>{desc}</desc>}
      {children}
    </svg>
  );
};

export { default as IconArrowLeft } from "./ArrowLeft";
export { default as IconArrowRight } from "./ArrowRight";
export { default as IconPlus } from "./Plus";
export { default as IconSettings } from "./Settings";
export { default as IconPlaylistAdd } from "./PlaylistAdd";
export { default as IconPlay } from "./Play";
export { default as IconGrip } from "./IconGrip";