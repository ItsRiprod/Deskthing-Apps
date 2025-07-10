import React, { ReactElement } from "react";

export interface IconProps {
  iconSize?: number;
  color?: string;
  title?: string;
  titleId?: string;
  desc?: string;
  descId?: string;
  className?: string;
  dangerouslySetInnerHTML?: { __html: string };
  SvgComponent?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export const Icon: React.FC<IconProps> = ({
  iconSize = 24,
  color = "currentColor",
  title,
  titleId,
  desc,
  descId,
  className,
  dangerouslySetInnerHTML,
  SvgComponent,
  ...restProps
}): JSX.Element => {
  return (
    <svg
      color={color}
      role="img"
      height={iconSize}
      width={iconSize}
      viewBox={`0 0 ${iconSize} ${iconSize}`}
      className={className}
      {...restProps}
    >
      {title && <title id={titleId}>{title}</title>}
      {desc && <desc id={descId}>{desc}</desc>}
      {dangerouslySetInnerHTML ? (
        <g dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
      ) : SvgComponent ? (
        <g>
          <SvgComponent
            width={iconSize}
            height={iconSize}
            color={color}
            aria-hidden="true"
            focusable="false"
          />
        </g>
      ) : null}
    </svg>
  );
};

export const findClosestGlyphAvailable = (glyphList, val) => {
  return glyphList.reduce((prev, current) => {
    if (Math.abs(current.size - val) < Math.abs(prev.size - val)) {
      return current;
    } else {
      return prev;
    }
  });
};
