
import React, { useState, useEffect } from 'react';
import ProcessStore from '../stores/ProcessStore';
import SimpleGraph from './Graph';

const MEMUsage: React.FC = () => {
  const [memUsage, setMemUsage] = useState(ProcessStore.memUsage);

  useEffect(() => {
    const unsubscribe = ProcessStore.on((data) => {
      setMemUsage(data.memUsage);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="relative pb-5 w-full h-full flex items-center justify-center font-semibold text-white text-5xl rounded-xl overflow-hidden">
                <div className="z-10 absolute top-0 left-0 flex">
                    <p className="mr-3">MEM</p>
                    <p>{Math.ceil(memUsage * 100)}%</p>
                </div>
                <SimpleGraph data={memUsage} />
                
            </div>
  );
};

export default MEMUsage;
