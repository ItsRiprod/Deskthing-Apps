export const findAlbumArtColor = async (image: HTMLImageElement): Promise<string | null> => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        console.error('Failed to get 2D context from canvas.');
        return null;
    }

    const width = (canvas.width = image.width);
    const height = (canvas.height = image.height);

    // Draw the image onto the canvas
    context.drawImage(image, 0, 0, width, height);

    // Get the image data (pixel data)
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    const colorCounts: { [color: string]: number } = {};
    let maxCount = 0;
    let dominantColor = '';

    // Iterate through each pixel
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];

        // Ignore pixels with transparency
        if (alpha < 255) continue;
        if (r + g + b < 10) continue;

        const color = `${r},${g},${b}`;

        // Count the frequency of each color
        if (colorCounts[color]) {
            colorCounts[color]++;
        } else {
            colorCounts[color] = 1;
        }

        // Keep track of the most common color
        if (colorCounts[color] > maxCount) {
            maxCount = colorCounts[color];
            dominantColor = color;
        }
    }

    if (dominantColor) {
        return `rgb(${dominantColor})`;
    }

    return null;
};