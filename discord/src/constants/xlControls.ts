import { CONTROL_OPTIONS, CONTROL_SIZE } from "@shared/types/discord";

export const XL_CONTROLS_ENABLED = true;
const CONTROL_SIZE_MAP: Record<CONTROL_SIZE, number> = {
  [CONTROL_SIZE.SMALL]: 72,
  [CONTROL_SIZE.MEDIUM]: 96,
  [CONTROL_SIZE.LARGE]: 120,
};

export const getControlLayout = (size: CONTROL_SIZE = CONTROL_SIZE.MEDIUM) => {
  const buttonSize = CONTROL_SIZE_MAP[size] ?? CONTROL_SIZE_MAP[CONTROL_SIZE.MEDIUM];
  const paddingTop = 4;
  const paddingBottom = 4;
  const marginBottom = 0;
  const innerPaddingY = 4;
  const gap = size === CONTROL_SIZE.SMALL ? 44 : size === CONTROL_SIZE.LARGE ? 64 : 56; // px
  const totalHeight =
    buttonSize + paddingTop + paddingBottom + marginBottom + innerPaddingY * 2;

  return {
    buttonSize,
    paddingTop,
    paddingBottom,
    marginBottom,
    innerPaddingY,
    gap,
    totalHeight,
  };
};

const defaultLayout = getControlLayout(CONTROL_SIZE.MEDIUM);
export const XL_CONTROL_PADDING_TOP = defaultLayout.paddingTop;
export const XL_CONTROL_PADDING_BOTTOM = defaultLayout.paddingBottom;
export const XL_CONTROL_MARGIN_BOTTOM = defaultLayout.marginBottom;
export const XL_CONTROL_INNER_PADDING_Y = defaultLayout.innerPaddingY;
export const XL_CONTROL_BUTTON_SIZE = defaultLayout.buttonSize; // px
export const XL_CONTROL_MIN_HEIGHT = XL_CONTROL_BUTTON_SIZE;
export const XL_CONTROL_TOTAL_HEIGHT = defaultLayout.totalHeight;
export const XL_CONTROL_FALLBACK_ORDER: CONTROL_OPTIONS[] = [
  CONTROL_OPTIONS.MUTE,
  CONTROL_OPTIONS.DEAFEN,
  CONTROL_OPTIONS.DISCONNECT,
];
