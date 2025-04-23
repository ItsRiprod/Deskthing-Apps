import React, { useEffect, useState } from "react";
import ProcessStore from "../stores/ProcessStore";
import { SystemData } from "@shared/types";

const Dashboard: React.FC = () => {
  const [processData, setProcessData] = useState<SystemData>();
  const [cpuTemp, setCpuTemp] = useState<number | null>(null);
  const [gpuTemp, setGpuTemp] = useState<number | null>(null);
  const [gpuUsage, setGpuUsage] = useState<number | null>(null); // ✅ fixed name

  useEffect(() => {
    const unsubscribe = ProcessStore.on((data) => {
      try {
        console.log("✅ Received system data:", data);
        if (data.gpu) {
          console.log("GPU data:", data.gpu);
        }
      } catch (err) {
        console.warn("🛑 Could not log data:", err);
      }

      setProcessData(data);

      if (data.cpu?.temp) {
        setCpuTemp(Math.round(data.cpu.temp));
      }

      if (data.gpu?.temp) {
        setGpuTemp(Math.round(data.gpu.temp));
      }

      if (data.gpu?.usage !== undefined) {
        const usage = Math.ceil(data.gpu.usage);
        setGpuUsage(usage);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const cpuPercent = processData?.cpu ? Math.ceil(processData.cpu.load * 100) : null;
  const gpuPercent = gpuUsage !== null ? gpuUsage : null; 

  const ramUsedBytes = processData?.ram?.usage ?? 0;
  const ramTotalBytes = processData?.ram?.total ?? 0;

  const bytesToGB = (bytes: number) => (bytes / (1024 ** 3)).toFixed(1); // GB with 1 decimal

  const ramUsedGB = bytesToGB(ramUsedBytes);
  const ramTotalGB = bytesToGB(ramTotalBytes);

  const ramUsagePercent = ramTotalBytes > 0
    ? Math.round((ramUsedBytes / ramTotalBytes) * 100)
    : 0;

  const ramTotalUsageText = `${ramUsedGB} GB / ${ramTotalGB} GB (${ramUsagePercent}%)`;

  return (
    <div className="flex items-center justify-center h-screen w-screen bg-[#131219]">
      <div className="grid grid-cols-2 gap-4 p-4 sm:p-8 w-full max-w-6xl">
        <Box
          label="CPU"
          usage={cpuPercent !== null ? `${cpuPercent}%` : "Loading..."}
          usagePercent={cpuPercent ?? 0}
          temp={cpuTemp !== null ? `${cpuTemp}°C` : "N/A"}
          bgColour="bg-[#009285]"
          barColour="bg-[#09CEB2]"
          barBgColour="bg-[#00756B]"
          usageLabel="temp"
          totalUsage=""
        />
        <Box
          label="GPU"
          usage={gpuPercent !== null ? `${gpuPercent}%` : "Loading..."}
          usagePercent={gpuPercent ?? 0}
          temp={gpuTemp !== null ? `${gpuTemp}°C` : "N/A"}
          bgColour="bg-[#1360C5]"
          barColour="bg-[#2E87E6]"
          barBgColour="bg-[#064DA6]"
          usageLabel="temp"
          totalUsage=""
        />
        <div className="col-span-2">
          <Box
            label="RAM"
            usage={`${ramUsedGB} GB`}
            usagePercent={ramUsagePercent}
            temp="N/A"
            bgColour="bg-[#6E38AE]"
            barColour="bg-[#E952AB]"
            barBgColour="bg-[#50228E]"
            usageLabel="usage"
            totalUsage={ramTotalUsageText}
          />
        </div>
      </div>
    </div>
  );
};

interface BoxProps {
  label: string;
  usage: string;
  temp: string;
  bgColour: string;
  barColour: string;
  barBgColour: string;
  usageLabel: string;
  totalUsage: string;
  usagePercent?: number;
}

const Box: React.FC<BoxProps> = ({
  label,
  usage,
  temp,
  bgColour,
  barColour,
  barBgColour,
  usageLabel,
  totalUsage,
  usagePercent
}) => (
  <div className={`p-4 sm:p-6 pt-[14px] rounded-xl text-[#FCE6CA] flex gap-6 h-48 ${bgColour}`}>
    <div className="w-full">
      <h2 className="text-2xl sm:text-4xl font-inter font-semibold">{label}</h2>

      <div className="flex items-center mt-3 w-full">
        {/* Horizontal Bar */}
        <div className={`${barBgColour} w-2/3 h-4 rounded-[4px] overflow-hidden`}>
          <div
            className={`${barColour} h-4 rounded-[4px]`}
            style={{ width: usagePercent !== undefined ? `${usagePercent}%` : '0%' }}
          />
        </div>

        <span className="text-2xl sm:text-4xl font-inter font-semibold ml-[21px]">{usage}</span>
      </div>

      {usageLabel === "usage" ? (
        <p className="text-lg sm:text-2xl font-inter mt-[36px]">Usage: {totalUsage}</p>
      ) : (
        <p className="text-lg sm:text-2xl font-inter mt-[36px]">Temp: {temp}</p>
      )}
    </div>
  </div>
);

export default Dashboard;
