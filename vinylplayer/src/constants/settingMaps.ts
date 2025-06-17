export const sizeClassMap = {
  small: 'w-[40vw] h-[40vw]',
  medium: 'w-[65vw] h-[65vw]',
  large: 'w-[100vw] h-[100vw]',
  xl: 'w-[130vw] h-[130vw]'
};


export const textAlignMap: Record<string, string> = {
  left: 'items-start',
  center: 'items-center',
  right: 'items-end',
};

export const recordXAlignMap: Record<string, Record<string, string>> = {
  small: {
    left: 'left-[-20vw]',
    center: 'left-[30vw]',
    right: 'left-[80vw]',
  },
  medium: {
    left: 'left-[-30vw]',
    center: 'left-[18vw]',
    right: 'left-[65vw]',
  },
  large: {
    left: 'left-[-100vh]',
    center: 'left-[0vh]',
    right: 'left-[100vh]',
  },
};

export const recordYAlignMap: Record<string, Record<string, string>> = {
  small: {
    top: 'top-[-20vw]',
    middle: 'top-[10vw]',
    bottom: 'top-[40vw]',
  },
  medium: {
    top: 'top-[-35vw]',
    middle: 'top-[-2.5vw]',
    bottom: 'top-[27.5vw]',
  },
  large: {
    top: 'top-[-60vw]',
    middle: 'top-[-20vw]',
    bottom: 'top-[25vw]',
  },
};