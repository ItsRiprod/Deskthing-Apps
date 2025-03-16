import { useState } from "react"

type SwipeContainerTypes = {
    children: React.ReactNode
    className?: string
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onTap?: () => void
    swipeLeftIcon?: React.ReactNode
    swipeRightIcon?: React.ReactNode
}

export const SwipeContainer = ({ children, className, onSwipeLeft, onSwipeRight, swipeLeftIcon, swipeRightIcon }: SwipeContainerTypes) => {
    const [offset, setOffset] = useState(0)
    const [startX, setStartX] = useState(0)
    const threshold = 100

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        setStartX(e.clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX
        const diff = currentX - startX
        setOffset(diff)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (startX === 0) return
        const currentX = e.clientX
        const diff = currentX - startX
        setOffset(diff)
    }

    const handleTouchEnd = () => {
        if (offset > threshold && onSwipeRight) {
            onSwipeRight()
        } else if (offset < -threshold && onSwipeLeft) {
            onSwipeLeft()
        }
        setOffset(0)
        setStartX(0)
    }

    const handleMouseUp = () => {
        if (startX === 0) return
        if (offset > threshold && onSwipeRight) {
            onSwipeRight()
        } else if (offset < -threshold && onSwipeLeft) {
            onSwipeLeft()
        }
        setOffset(0)
        setStartX(0)
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <div
                className="relative flex items-center transition-transform"
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {swipeLeftIcon && (
                    <div className="absolute left-0 transform -translate-x-full">
                        {swipeLeftIcon}
                    </div>
                )}
                {children}
                {swipeRightIcon && (
                    <div className="absolute right-0 transform translate-x-full">
                        {swipeRightIcon}
                    </div>
                )}
            </div>
        </div>
    )
}