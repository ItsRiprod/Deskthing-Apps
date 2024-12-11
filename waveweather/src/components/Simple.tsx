import { useEffect, useState } from "react";
import { WeatherData } from "../stores/weatherStore";
import { SettingsStore } from "../stores/settingsStore";
import { DeskThing, SocketData } from 'deskthing-client';  // Import DeskThing client for Spotify data
import { IconPinwheel } from "../assets/Icons";

interface WeatherProps {
  weatherData: WeatherData | null;
}

// Move getInstance() calls outside the hook to avoid redundant calls
const deskThingClient = DeskThing.getInstance();
const settingsStore = SettingsStore.getInstance();

const Simple = ({ weatherData }: WeatherProps) => {
  // Initial time fetched from SettingsStore
  const [time, setTime] = useState(() => {
    return settingsStore.getTime().trim();
  });

  // State to store the Spotify thumbnail URL, start with a placeholder image
  const [thumbnail, setThumbnail] = useState<string | null>();

  useEffect(() => {
    const handleTime = async (time: string) => {
      setTime(time.trim());
    };

    // Function to handle music updates (e.g., new song data)
    const handleMusic = (socketData: SocketData) => {
      const data = socketData.payload
      console.log('Music Data Received:', data);
      if (data?.thumbnail) {
        setThumbnail(data.thumbnail); // Set the thumbnail URL with real data when available
      }
    };

    // Request current song data when component mounts

    const fetchSong = async () => {
      const musicData = await deskThingClient.getMusic()
      musicData && setThumbnail(musicData.thumbnail);
    }

    setTimeout(fetchSong, 1000);


    // Listen for updates to song data
    const unsubscribe = deskThingClient.on('music', handleMusic);

    // Set the time listener
    const removeTimeListener = settingsStore.onTime(handleTime);

    return () => {
      // Clean up listeners on unmount
      removeTimeListener();
      unsubscribe();
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      
      {/* Blurred Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${thumbnail})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(25px)',
        }}
      ></div>

      {/* Overlay to adjust the brightness by lowering opacity */}
      <div className="absolute inset-0 bg-black opacity-60 z-10"></div>

      {/* Content on top of background and overlay */}
      <div className="relative w-full h-full flex items-center justify-center z-20">
        
        {/* Left section: Temperature and Time */}
        <div
          className="flex flex-col text-white"
          style={{
            marginRight: '3vw',
            paddingLeft: '2vw', // To move content away from the left side
            paddingBottom: '4vh', // To shift everything a bit higher
          }}
        >
          {/* Temperature */}
          <p className="text-[23vw] font-montserrat font-extrabold leading-none">
            {weatherData ? Math.round(weatherData.current.apparentTemperature) + '°' : '00°'}
          </p>
          
          {/* Time */}
          <p className="text-[9vw] font-montserrat font-extralight leading-none tracking-tighter">
            {time}
          </p>
        </div>

        {/* Right section: Spotify Thumbnail */}
        {(
          <div
            className="flex-shrink-0"
            style={{
              width: '40vw',
              height: '40vw',
              marginLeft: '4vw', // Add some separation from the temperature and time
            }}
          >
            {thumbnail ? <img src={thumbnail} alt="Spotify album cover" className="object-cover w-full h-full rounded-lg" />
              :
              <div className="w-full h-full bg-zinc-800 rounded-lg flex flex-col items-center justify-center">
                <IconPinwheel className="animate-spin text-white stroke-2" iconSize={256} />
                <p className="font-HelveticaNeue text-white text-center text-2xl font-semibold">
                  Waiting for song...
                </p>
                </div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Simple;
