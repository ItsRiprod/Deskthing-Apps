import { LinkClient } from "@shared/models"
import useClientStore from "@src/clientStore"
import React, { useCallback, useRef, useState } from "react";

interface ColorPickerProps {
  client: LinkClient;
}
const ColorPicker: React.FC<ColorPickerProps> = ({ 
  client,
}) => {
  const updateColor = useClientStore((state) => state.updateColor)
  const [color, setColor] = useState(client.color);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const onColorChange = async (newColor: string) => {
    try {
      updateColor(newColor);
    } catch (error) {
      console.error('Failed to update color:', error);
    }
  };

  // Debounce color updates
  const debouncedUpdateColor = useCallback((newColor: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onColorChange(newColor);
    }, 100);
  }, [onColorChange]);

  // Color options
  const colorOptions = [
    "#9333EA", // Purple
    "#14B8A6", // Teal
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#10B981", // Emerald
    "#EF4444", // Red
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {colorOptions.map((colorOption) => (
          <button
            key={colorOption}
            className={`w-8 h-8 rounded-full transition-all duration-200 ${
              color === colorOption ? 'ring-2 ring-white transform scale-110' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: colorOption }}
            onClick={(e) => {
              e.stopPropagation();
              setColor(colorOption);
              debouncedUpdateColor(colorOption);
            }}
          />
        ))}
      </div>
      
      <input
        type="color"
        value={color}
        onChange={(e) => {
          e.stopPropagation();
          setColor(e.target.value);
          debouncedUpdateColor(e.target.value);
        }}
        className="w-full h-8 rounded cursor-pointer"
      />
    </div>
  );
};

export default ColorPicker;