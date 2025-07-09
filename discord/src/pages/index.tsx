import { useUIStore } from "@src/stores/uiStore";
import { Chat } from "./Chat";
import { Browsing } from "./Browsing";
import { Call } from "./Call";
import { Dashboard } from "./Dashboard";
import { Loading } from "./Loading";

export const PageManager = () => {
  const currentPage = useUIStore((state) => state.currentPage);
  const isLoading = useUIStore((state) => state.isLoading);

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {currentPage === "chat" && <Chat />}
          {currentPage === "browsing" && <Browsing />}
          {currentPage === "call" && <Call />}
          {currentPage === "dashboard" && <Dashboard />}
        </div>
      )}
    </div>
  );
};
