import React from 'react'
import { MusicStore } from '../Stores/musicStore'

interface CardProps {
  title: string
  value: string
}

const Card: React.FC<CardProps> = ({ title, value }) => {
  const musicStore = MusicStore.getInstance()
  const backgroundColor = musicStore.getBackgroundColor()

  const cardStyle: React.CSSProperties = {
    color: `rgb(${backgroundColor.join(',')})`,
  }

  return (
    <div style={cardStyle} className="p-5 rounded-lg bg-slate-700 w-full h-full flex items-center flex-col justify-center shadow-lg">
            <div className="text-4xl font-bold mb-2">{value}</div>
            <div className="text-white ">{title}</div>
    </div>
  )
}

export default Card
