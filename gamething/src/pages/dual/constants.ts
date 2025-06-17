
export const SHIP_SIZES = {
  basic: {
    sizeX: 40,
    sizeY: 40,
    hp: 100
  },
  charged: {
    sizeX: 50,
    sizeY: 50,
    hp: 150
  },
  reflected: {
    sizeX: 45,
    sizeY: 45,
    hp: 125
  }
} as const;

export const SHIP_INITIAL_STATS = {
  basic: {
    shipType: 'basic' as const,
    ...SHIP_SIZES.basic,
    x: 0,
    y: 0
  },
  charged: {
    shipType: 'charged' as const,
    ...SHIP_SIZES.charged,
    x: 0,
    y: 0
  },
  reflected: {
    shipType: 'reflected' as const,
    ...SHIP_SIZES.reflected,
    x: 0,
    y: 0
  }
} as const;
