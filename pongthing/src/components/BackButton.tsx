  import { useUIStore } from "@src/stores/uiStore";

  export const BackButton = () => {
    const goBack = useUIStore((state) => state.goBack);

    return (
      <button 
        className="absolute z-10 bottom-5 left-5 px-4 py-2 text-sm font-medium text-gray-700 border"
        onClick={goBack}
      >
        Back
      </button>
    );
  };
