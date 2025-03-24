
import React, { useState, useEffect } from 'react';
import ProcessStore from '../stores/ProcessStore';
import SimpleGraph from './Graph';

const CPUUsage: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(ProcessStore.getProcessData?.cpu?.load || 0);

  useEffect(() => {
    const unsubscribe = ProcessStore.on((data) => {
      if (data.cpu) {
        setCpuUsage(data.cpu.load);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="relative pb-5 w-full h-full flex items-center justify-center font-semibold text-white text-5xl rounded-xl overflow-hidden">
                <div className="z-10 absolute top-0 left-0 flex">
                    <p className="mr-3">CPU</p>
                    <p>{Math.ceil(cpuUsage * 100)}%</p>
                </div>
                <SimpleGraph data={cpuUsage} />
                
            </div>
  );
};

export default CPUUsage;
