import useClientStore from "@src/clientStore"
import React from "react";

interface ConnectButtonProps {
}

const ConnectButton: React.FC<ConnectButtonProps> = () => {
  const requestNewClient = useClientStore((state) => state.requestNewClient)

  return (
    <div className="flex flex-col items-center">
      <div className="text-zinc-300 mb-2">Not Connected</div>
      <button 
        onClick={requestNewClient}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Connect to Server
      </button>
    </div>
  );
};

export default ConnectButton;
