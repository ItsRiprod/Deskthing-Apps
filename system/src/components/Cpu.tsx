import React, { useEffect, useState } from "react";
import LineGraph from "./LineGraph";
import ProcessStore from "../stores/ProcessStore";
import { SystemData } from "@shared/types";

const Cpu: React.FC = () => {
  const [processData, setProcessData] = useState<SystemData>();

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
      <p className="text-5xl font-semibold w-full justify-center content-center items-center text-center">
        CPU
      </p>
      <div className="flex flex-wrap h-full">
        {processData?.ram?.usage && (
          <Graph
            title="Memory Usage"
            usage={processData.ram.usage / 1073741824}
            display={`${(processData.ram.usage / 1073741824).toFixed(2)} GiB`}
          />
        )}

        {processData?.cpu?.load && (
          <Graph
            title="CPU Usage"
            usage={processData.cpu.load * 0.01}
            display={`${Math.round(processData.cpu.load)}%`}
          />
        )}

        {processData?.cpu?.temp && (
          <Graph
            title="CPU Temperature"
            usage={processData.cpu.temp}
            display={`${processData.cpu.temp}°C`}
          />
        )}

        {processData?.gpu?.temp && (
          <Graph
            title="GPU Temperature"
            usage={processData.gpu.temp}
            display={`${processData.gpu.temp}°C`}
          />
        )}

        {processData?.gpu?.usage && (
          <Graph
            title="GPU Usage"
            usage={processData.gpu.usage}
            display={`${Math.ceil(processData.gpu.usage * 100)}%`}
          />
        )}

        {processData?.network?.upload && (
          <Graph
            title="Upload Speed"
            usage={processData.network.upload / 1048576}
            display={`${(processData.network.upload / 1048576).toFixed(
              2
            )} MB/s`}
          />
        )}

        {processData?.network?.download && (
          <Graph
            title="Download Speed"
            usage={processData.network.download / 1048576}
            display={`${(processData.network.download / 1048576).toFixed(
              2
            )} MB/s`}
          />
        )}

        {processData?.network?.ping && (
          <Graph
            title="Ping Time"
            usage={processData.network.pingTime}
            display={`${processData.network.pingTime} ms`}
          />
        )}

        {processData?.processes?.count && (
          <Graph
            title="Total Number of Processes"
            usage={processData.processes.count}
            display={`${processData.processes.count}`}
          />
        )}

        {processData?.processes?.active && (
          <Graph
            title="Active Processes"
            usage={processData.processes.active}
            display={`${processData.processes.active}`}
          />
        )}
      </div>
    </div>
  );
};

const Graph: React.FC<{ title: string; usage: number; display: string }> = ({
  usage,
  title,
  display,
}) => {
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
