import React from 'react'

interface LoadingProps {
  text?: string
}

const Loading: React.FC<LoadingProps> = ({ text }) => {
  return (
    <div className="font-geist font-semibold text-white w-full h-full bg-zinc-800 flex flex-col justify-center items-center">
      <div className="animate-spin">
        <svg className="w-16 h-16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      </div>
      <div className="text-lg">{ text }</div>
    </div>
  )
}

export default Loading