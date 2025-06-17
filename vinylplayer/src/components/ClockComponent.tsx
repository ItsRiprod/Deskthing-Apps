import { DEVICE_CLIENT } from "@deskthing/types"
import { FC, useEffect, useState } from "react"
import { DeskThing } from "@deskthing/client"
import { useMusicStore } from "@src/stores/musicStore"

type ClockComponentProps = {
  className?: string
}

export const ClockComponent: FC<ClockComponentProps> = ({ className }) => {
  const textColor = useMusicStore((state) => state.textColor)
  const [currentTime, setCurrentTime] = useState('XX:XX XX')

  useEffect(() => {
    const removeTimeListener = DeskThing.on(DEVICE_CLIENT.TIME, (data) => {
      if (typeof data.payload === 'string') {
        setCurrentTime(data.payload);
      } else {
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
      <p style={{ color: textColor }} className={`text-xl text-nowrap ${className}`}>
        {currentTime}
      </p>
  )
}