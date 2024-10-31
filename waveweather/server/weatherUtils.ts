export const url = "https://api.open-meteo.com/v1/forecast";

// Helper function to form time ranges
export const range = (start: number, stop: number, step: number) =>
	Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);