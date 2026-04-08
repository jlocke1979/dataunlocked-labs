export const US_POP = 340000000;
export const WAITLIST_STOCK = 103000;
export const UNIT = 1000;

export const TOTAL_DOTS = Math.floor(US_POP / UNIT);
export const WAITLIST_DOTS = Math.floor(WAITLIST_STOCK / UNIT);

// temporary rendering cap for performance
export const RENDER_DOTS = 10000;