import { useUIStore } from "@src/stores/uiStore";
import { Chat } from "./Chat";
import { Browsing } from "./Browsing";
import { Call } from "./Call";
import { Dashboard } from "./dashboard/Dashboard";
import { Loading } from "./Loading";

export const PageManager = () => {
  const currentPage = useUIStore((state) => state.currentPage);
  const isLoading = useUIStore((state) => state.isLoading);

  return (
    <div className="flex flex-col h-full max-h-full">
      {isLoading ? (
        <Loading />
      ) : (
        <div className="h-full w-full max-h-full">
          {currentPage === "chat" && <Chat />}
          {currentPage === "browsing" && <Browsing />}
          {currentPage === "call" && <Call />}
          {currentPage === "dashboard" && <Dashboard />}
        </div>
      )}
    </div>
  );
};
