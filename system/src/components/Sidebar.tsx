  import React, { useEffect } from 'react';
import ProcessStore, { ProcessData } from '../stores/ProcessStore';

  interface SidebarProps {
    selectedTab: string;
    onTabChange: (tab: string) => void;
  }

  const Sidebar: React.FC<SidebarProps> = ({ selectedTab, onTabChange }) => {
    const [cpuUsage, setCpuUsage] = React.useState(0);
    const [memoryUsage, setMemoryUsage] = React.useState(0);

    useEffect(() => {
        const onUsageUpdate = (data: ProcessData) => {
            setCpuUsage(data.cpuUsage);
            setMemoryUsage(data.memUsage);
        };
        const removeListener = ProcessStore.on(onUsageUpdate);

        return () => {
            removeListener();
        };
    })
    const handleChange = (newValue: string) => {
      onTabChange(newValue);
    };

    return (
      <div className="h-full p-1">
        <Tab
          onClick={() => handleChange("cpu")}
          isSelected={selectedTab == "cpu"}
        >
          CPU {Math.ceil(cpuUsage* 100)}%
        </Tab>
        <Tab
          onClick={() => handleChange("mem")}
          isSelected={selectedTab == "mem"}
        >
          MEM {Math.ceil(memoryUsage * 100)}%
        </Tab>
      </div>
    );
  };


  const Tab = ({children, isSelected, onClick}: {children: React.ReactNode, isSelected: boolean, onClick: () => void}) => {
    return (
      <button
        onClick={onClick}
        className={`font-semibold text-white w-full px-4 py-2 ${
            isSelected ? "bg-slate-700" : "bg-black"
          }`}>
        {children}
      </button>
    )
  }

  export default Sidebar;
