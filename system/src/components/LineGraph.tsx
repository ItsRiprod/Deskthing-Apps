
import React, { useEffect, useState, useRef } from 'react';

interface LineGraphProps {
  data: number;
}

const LineGraph: React.FC<LineGraphProps> = ({ data }) => {
  const [values, setValues] = useState<number[]>(new Array(10).fill(0));
  const [maxValue, setMaxValue] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(0);
  const [svgHeight, setSvgHeight] = useState(0);

  useEffect(() => {
    setValues(prevValues => {
      const updatedValues = [...prevValues.slice(1), data];

      const newMaxValue = Math.max(1, ...updatedValues);
      setMaxValue(newMaxValue > 1 ? newMaxValue : 1);

      return updatedValues;
    });
  }, [data, maxValue]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setSvgWidth(containerRef.current.clientWidth);
        setSvgHeight(containerRef.current.clientHeight);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const points = values
    .map(
      (value, index) =>
        `${index * (svgWidth / (values.length - 1))},${
          svgHeight - (value / maxValue) * svgHeight
        }`
    )
    .join(' ');

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg className="w-full h-full">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {values.map((value, index) => (
          <circle
            key={index}
            cx={index * (svgWidth / (values.length - 1))}
            cy={svgHeight - value * svgHeight}
            r="3"
            fill="currentColor"
            className=""
          >
            <title>{Math.round(value * 100)}%</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

export default LineGraph;
