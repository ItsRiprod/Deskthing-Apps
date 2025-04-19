import React, { useEffect, useState } from "react";
import ProcessStore from "../stores/ProcessStore";
import { SystemData } from "@shared/types";



const Dashboard: React.FC = () => {

    const [processData, setProcessData] = useState<SystemData>();
    const [cpuTemp, setCpuTemp] = useState<number | null>(null);


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
    
    
          if (data.cpu?.load !== undefined) {
            const percent = Math.ceil(data.cpu.load * 100);
          }
    
        });
    
        return () => {
          unsubscribe();
        };
      }, []);

      const cpuPercent = processData?.cpu ? Math.ceil(processData.cpu.load * 100) : null;


  return (
    <div className="flex items-center justify-center h-screen w-screen bg-black">
      <div className="grid grid-cols-2 gap-4 p-4 sm:p-8 w-full max-w-6xl">
        {/* First Row */}
        <Box label="CPU" usage={cpuPercent !== null ? `${cpuPercent}%` : "Loading..."} temp="68°C" bgColour="bg-[#009285]" barColour="bg-[#09CEB2]" barBgColour="bg-[#00756B]" usageLabel="temp" totalUsage="" />
        <Box label="GPU" usage="40%" temp="62°C" bgColour="bg-[#1360C5]" barColour="bg-[#2E87E6]" barBgColour="bg-[#064DA6]" usageLabel="temp" totalUsage="" />

        {/* Second Row (spanning two columns) */}
        <div className="col-span-2">
          <Box label="RAM" usage="14.2 GB" temp="N/A" bgColour="bg-[#6E38AE]" barColour="bg-[#E952AB]" barBgColour="bg-[#50228E]" usageLabel="usage" totalUsage="14.2 GB / 31.9 GB (48%)" />
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
}

const Box: React.FC<BoxProps> = ({ label, usage, temp, bgColour, barColour, barBgColour, usageLabel, totalUsage }) => (
  <div className={`p-4 sm:p-6 pt-[14px] rounded-xl text-[#FCE6CA] flex gap-6 h-48 ${bgColour}`}>
    <div className="w-full">
      <h2 className="text-2xl sm:text-4xl font-inter font-semibold">{label}</h2>

      <div className="flex items-center mt-3 w-full">
        {/* Horizontal Bar */}
        <div className={`${barBgColour} w-2/3 h-4 rounded-[4px] overflow-hidden`}>
          <div
            className={`${barColour} h-4 rounded-[4px]`}
            style={{ width: '60%' }} // Static temp fill
          />
        </div>

        {/* Always showing Usage on the right */}
        <span className="text-2xl sm:text-4xl font-inter font-semibold ml-[21px]">{usage}</span>
      </div>

      {/* Conditionally render the appropriate text at the bottom */}
      {usageLabel === "usage" ? (
        <p className="text-lg sm:text-2xl font-inter mt-[36px]">Usage: {totalUsage}</p>
      ) : (
        <p className="text-lg sm:text-2xl font-inter mt-[36px]">Temp: {temp}</p>
      )}
    </div>
  </div>
);

export default Dashboard;
