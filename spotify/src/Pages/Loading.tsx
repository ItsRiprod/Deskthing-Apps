import React from 'react'

interface LoadingProps {
  text?: string
}

const Loading: React.FC<LoadingProps> = ({ text }) => {
  return (
    <div className="font-geist font-semibold text-white w-full h-full bg-zinc-800 flex flex-col justify-center items-center">
      <div className="bg-cover bg-center bg-no-repeat w-[25vw] h-[25vw] animate-spin" style={{backgroundImage:`url(./icon/vinyl.svg)`}}></div>
      <div className="text-lg">{ text }</div>
      <p>Ensure an audiosource is setup in the server</p>
    </div>
  )
}

export default Loading