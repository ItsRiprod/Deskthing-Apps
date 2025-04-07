import React from "react";
import useClientStore, { getCurrentClient } from "../clientStore";

const ClientList: React.FC = () => {
  const { clients, incrementScore } = useClientStore();
  const currentClient = getCurrentClient();

  if (!clients.length) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        No clients connected yet...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clients.map((client) => {
        const isCurrentClient = client.id === currentClient?.id;
        
        return (
          <div 
            key={client.id} 
            className={`
              rounded-lg p-4 transition-all duration-300 border-2
              ${isCurrentClient ? 'border-blue-500 bg-gray-700' : 'border-gray-700 bg-gray-800'}
            `}
            style={{ borderLeftColor: client.color, borderLeftWidth: '6px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-2" 
                  style={{ backgroundColor: client.color }}
                ></div>
                <h3 
                  className={`font-semibold ${isCurrentClient ? 'cursor-pointer hover:text-blue-400' : ''}`}
                >
                  {isCurrentClient ? 'You' : `Client ${client.id?.substring(0, 6) || 'Pending...'}`}
                </h3>
                {isCurrentClient && (
                  <button 
                    onClick={incrementScore}
                    className="ml-2 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                  >
                    +1
                  </button>
                )}
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                {client.id?.substring(0, 8) || 'Pending...'}
              </span>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <div className="text-sm text-gray-400">Score</div>
              <div className="text-2xl font-bold">{client.score}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ClientList;