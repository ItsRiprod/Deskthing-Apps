import React from 'react'
import { MusicStore } from '../Stores/musicStore'

interface CardProps {
  title: string
  value: number
}

const Slider: React.FC<CardProps> = ({ title, value }) => {
  const musicStore = MusicStore.getInstance()
  const backgroundColor = musicStore.getBackgroundColor()

  const barStyle: React.CSSProperties = {
    background: `rgb(${backgroundColor.join(',')})`,
    width: `${value * 100}%`,
  }

  return (
    <div className="w-full h-full flex items-center flex-col justify-center shadow-lg">
            <div className="text-white ">{title}</div>
            <div className="w-full bg-slate-700 h-3">
                <div style={barStyle} className="h-full transition-all" />
            </div>
    </div>
  )
}

export default Slider
