import React, { useState, useEffect } from "react";
import useClientStore, { getCurrentClient } from "../clientStore";

const ColorPicker: React.FC = () => {
  const { updateColor } = useClientStore();
  const currentClient = getCurrentClient();
  const [color, setColor] = useState(currentClient?.color || "#3B82F6");

  // Update local state when the client's color changes
  useEffect(() => {
    if (currentClient?.color) {
      setColor(currentClient.color);
    }
  }, [currentClient?.color]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    updateColor(newColor);
  };

  // Predefined color options
  const colorOptions = [
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
    "#EC4899", // Pink
  ];

  if (!currentClient) {
    return (
      <div className="text-gray-500 italic">
        Waiting for connection...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-3">
        <div 
          className="w-8 h-8 rounded-full mr-3 border-2 border-white" 
          style={{ backgroundColor: color }}
        ></div>
        <h3 className="text-lg font-medium">Your Color</h3>
      </div>
      
      <div className="flex justify-between mb-4">
        {colorOptions.map((colorOption) => (
          <button
            key={colorOption}
            className={`w-8 h-8 rounded-full transition-all duration-200 ${
              color === colorOption ? 'ring-2 ring-white transform scale-110' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: colorOption }}
            onClick={() => {
              setColor(colorOption);
              updateColor(colorOption);
            }}
          />
        ))}
      </div>
      
      <div className="flex items-center">
        <input
          type="color"
          value={color}
          onChange={handleColorChange}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>
      
      <p className="text-xs text-gray-400 mt-2 text-center">
        Choose a preset color or pick a custom one
      </p>
    </div>
  );
};

export default ColorPicker;
