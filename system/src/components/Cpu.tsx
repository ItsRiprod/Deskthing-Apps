import React, { useEffect, useState } from 'react';
import LineGraph from './LineGraph';
import ProcessStore, { ProcessData } from '../stores/ProcessStore';

const Cpu: React.FC = () => {
  const [processData, setProcessData] = useState<ProcessData>();

    useEffect(() => {
      const unsubscribe = ProcessStore.on((data) => {
        setProcessData(data);
      });
  
      return () => {
        unsubscribe();
      };
    }, []);
  return (
    <div className="w-screen h-screen bg-black flex flex-col text-white p-4">
      <p className="text-5xl font-semibold w-full justify-center content-center items-center text-center">CPU</p>
      <div className="flex flex-wrap h-full">
      {processData?.memUsage && (
  <Graph
    title="Memory Usage"
    usage={processData.memUsage / 1073741824}
    display={`${(processData.memUsage / 1073741824).toFixed(2)} GiB`}
  />
)}

{processData?.cpuLoad && (
  <Graph
    title="CPU Usage"
    usage={processData.cpuLoad * 0.01}
    display={`${Math.round(processData.cpuLoad)}%`}
  />
)}

{processData?.cpuTemp && (
  <Graph
    title="CPU Temperature"
    usage={processData.cpuTemp}
    display={`${processData.cpuTemp}°C`}
  />
)}

{processData?.gpuTemp && (
  <Graph
    title="GPU Temperature"
    usage={processData.gpuTemp}
    display={`${processData.gpuTemp}°C`}
  />
)}

{processData?.gpuUsage && (
  <Graph
    title="GPU Usage"
    usage={processData.gpuUsage}
    display={`${Math.ceil(processData.gpuUsage * 100)}%`}
  />
)}

{processData?.uploadSpeed && (
  <Graph
    title="Upload Speed"
    usage={processData.uploadSpeed  / 1048576}
    display={`${(processData.uploadSpeed / 1048576).toFixed(2)} MB/s`}
  />
)}

{processData?.downloadSpeed && (
  <Graph
    title="Download Speed"
    usage={processData.downloadSpeed / 1048576} // Convert bytes to MB
    display={`${(processData.downloadSpeed / 1048576).toFixed(2)} MB/s`} // Convert bytes to MB and format to 2 decimal places
  />
)}

{processData?.diskRead && (
  <Graph
    title="Disk Read Speed"
    usage={processData.diskRead / 1048576}
    display={`${(processData.diskRead / 1048576).toFixed(2)} MB/s`}
  />
)}

{processData?.diskWrite && (
  <Graph
    title="Disk Write Speed"
    usage={processData.diskWrite}
    display={`${processData.diskWrite} MB/s`}
  />
)}

{processData?.ping && (
  <Graph
    title="Ping Time"
    usage={processData.pingTime}
    display={`${processData.pingTime} ms`}
  />
)}

{processData?.processCount && (
  <Graph
    title="Total Number of Processes"
    usage={processData.processCount}
    display={`${processData.processCount}`}
  />
)}

{processData?.activeProcesses && (
  <Graph
    title="Active Processes"
    usage={processData.activeProcesses}
    display={`${processData.activeProcesses}`}
  />
)}
      </div>
    </div>
  );
};


const Graph: React.FC<{  title: string; usage: number; display: string }> = ({ usage, title, display }) => {
  return (
    <div className="relative w-1/4 border">
      <p className="absolute right-0 text-3xl font-bold">{display}</p>
      <p className="absolute top-2">100%</p>
      <p className="absolute top-8">{title}</p>
      <div className="h-full pl-5 p-2 text-cyan-400">
        <LineGraph data={usage} />
      </div>
      <p className="absolute bottom-2">0%</p>
    </div>
  );
};


export default Cpu;
