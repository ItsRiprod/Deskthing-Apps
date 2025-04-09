import React from "react";
import useClientStore, { getCurrentClient } from "../clientStore";
import Client from "@src/components/Client";

const ClientList: React.FC = () => {
  const clients = useClientStore((state) => state.clients);
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
          <Client
            key={client.id}
            client={client}
            isCurrentClient={isCurrentClient}
          />
        );
      })}
    </div>
  );
};

export default ClientList;