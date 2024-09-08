
import React, { useEffect, useState } from 'react';

interface SimpleGraphProps {
  data: number;
}

const SimpleGraph: React.FC<SimpleGraphProps> = ({ data }) => {
  const [values, setValues] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (values.length > 10) {
      setValues(prevValues => prevValues.slice(1));
    }
    setValues(prevMemUsage => [...prevMemUsage, data]);
  }, [data]);

  return (
    <div className="h-full w-full flex items-end">
      {values.map((value, index) => (
        <div
          key={index}
          style={{
            height: `${value * 100 + 0.01}%`,
          }}
          className="group hover:bg-blue-400 bg-blue-500 w-1/6"
        ><p className="hidden group-hover:flex text-white w-full h-full items-center text-lg justify-center">{Math.round(value * 100)}%</p></div>
      ))}
    </div>
  );
};

export default SimpleGraph;
