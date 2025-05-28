import { DEVICE_CLIENT, SongData } from "@deskthing/types"
import { FC, useEffect, useState } from "react"
import { DeskThing } from "@deskthing/client"

type ClockComponentProps = {
  currentSong: SongData
  className?: string
}

export const ClockComponent: FC<ClockComponentProps> = ({ currentSong, className }) => {

  const [currentTime, setCurrentTime] = useState('XX:XX XX')

  useEffect(() => {
    const removeTimeListener = DeskThing.on(DEVICE_CLIENT.TIME, (data) => {
      if (typeof data.payload === 'string') {
        setCurrentTime(data.payload);
      } else {
        console.log(data.payload)
        const utcOffset = data.payload.timezoneOffset;
        const utcTime = data.payload.utcTime;
        const date = new Date(utcTime);
        const amPm = date.getUTCHours() >= 12 ? 'PM' : 'AM';
        date.setMinutes(date.getMinutes() - utcOffset); // current bug - time is inverted
        setCurrentTime(`${date.getUTCHours() % 12 || 12}:${date.getUTCMinutes().toString().padStart(2, '0')} ${amPm}`);
      }
    });

    return () => {
      removeTimeListener();
    };

  })

  return (
      <h1 className={`text-[10vw] text-nowrap ${currentSong?.color?.isLight ? 'text-black' : 'text-white'} ${className}`}>
        {currentTime}
      </h1>
  )
}