import { DEVICE_CLIENT, SongData } from "@deskthing/types"
import { FC, useEffect, useState } from "react"
import { DeskThing } from "@deskthing/client"

type ClockComponentProps = {
  currentSong: SongData
}

export const ClockComponent: FC<ClockComponentProps> = ({ currentSong }) => {

  const [currentTime, setCurrentTime] = useState('Waiting...')

  useEffect(() => {
    const removeTimeListener = DeskThing.on(DEVICE_CLIENT.TIME, (data) => {
      if (typeof data.payload === 'string') {
        setCurrentTime(data.payload);
      } else {
        const utcOffset = data.payload.timezoneOffset;
        const utcTime = data.payload.utcTime;
        const date = new Date(utcTime);
        date.setMinutes(date.getMinutes() + utcOffset);
        setCurrentTime(`${date.getUTCHours()}:${date.getUTCMinutes().toString().padStart(2, '0')}`);
      }
    });

    return () => {
      removeTimeListener();
    };

  })

  return (
    <div className="pl-5 h-[35vw] flex flex-col justify-center relative">
      <h1 className={`text-[10vw] ${currentSong?.color?.isLight ? 'text-black' : 'text-white'}`}>
        {currentTime}
      </h1>
    </div>
  )
}