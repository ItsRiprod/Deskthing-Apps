import { CategoricalChartState } from 'recharts/types/chart/types';
import { WeatherData } from '../stores/weatherStore';
import { XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

  interface GraphProps {
    weatherData: WeatherData | null;
    onTimeSelect: (time: number) => void;
  }


const Graph = ({ weatherData, onTimeSelect }:  GraphProps) => {
  // Convert data to a format suitable for Recharts
  if (!weatherData) {
    return <div>Loading...</div>;
  }

  const data = weatherData.hourly.time.map((time, index) => ({
    time: new Date(time).toLocaleTimeString().replace(':00 ', ' '), // Format the time as needed
    temperature: Math.round(weatherData.hourly.temperature2m[index]),
  }));

  const CustomDot = (props: { cx: number; cy: number; value: number[] }) => {
    const { cx, cy, value } = props;
    
    return (
      <g>
        <circle cx={cx} cy={cy} r={4} fill="#ff7300" />
        <text x={cx} y={cy - 10} fill="#FFFF" fontSize={10} textAnchor="middle">
          {value[1]}°C
        </text>
      </g>
    );
  };

  const handleClick = ( state: CategoricalChartState) => {
    onTimeSelect(state.activeTooltipIndex || 0); // Pass the selected timestamp to the parent
  };

  return (
    <AreaChart
      width={800}
      height={400}
      data={data}
      onClick={handleClick}
      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
    >
         <defs>
          <linearGradient id="colorTemperature" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff7300" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ff7300" stopOpacity={0}/>
          </linearGradient>
        </defs>
      <CartesianGrid horizontal={false} />
      <XAxis dataKey="time" />
      <YAxis dataKey="temperature"/>
      <Area dot={<CustomDot cx={0} cy={0} value={[]} />} type="monotone" dataKey="temperature" stroke="#ff7300" fillOpacity={1} fill="url(#colorTemperature)" />
    </AreaChart>
  );
};

export default Graph
