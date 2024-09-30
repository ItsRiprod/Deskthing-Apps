import React, { CSSProperties, useEffect, useRef, useState } from "react";

interface ScrollingTextProps {
  /// Any other class names you need to put inside this component
  className?: string;
  /// The text (or component) to put inside. It should be inline.
  text?: React.ReactNode;
  /// Width on either side to fade in px, if the text wraps around
  fadeWidth?: number;
}

export function ScrollingText({
  text,
  className = "",
  fadeWidth = 8,
  ...props
}: ScrollingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const dupeTextRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const calculateOverflow = () => {
    const container = containerRef.current;
    const textElement = textRef.current;
    const dupe = dupeTextRef.current;

    if (container && textElement) {
      let isTextOverflowing;
      let len;

      if (dupe !== null) {
        isTextOverflowing = textElement.scrollWidth / 2 > container.offsetWidth;
        len = textElement.scrollWidth / 2;
      } else {
        isTextOverflowing = textElement.scrollWidth > container.offsetWidth;
        len = textElement.scrollWidth;
      }

      setIsOverflowing(isTextOverflowing);

      if (isTextOverflowing) {
        setContainerWidth(container.offsetWidth);
        const duration = len / 30; // Adjust speed here
        setAnimationDuration(duration);
        setTextWidth(len);
      }
    }
  };

  useEffect(() => {
    calculateOverflow();
  }, [text]);

  useEffect(() => {
    window.addEventListener("resize", calculateOverflow);
    return () => window.removeEventListener("resize", calculateOverflow);
  }, []);

  useEffect(() => {
    const pixelWidth = 8;
    const leftStop = (pixelWidth / containerWidth) * 100;
    const rightStop = 100 - leftStop;
  }, [containerWidth]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden` + className}
      style={
        isOverflowing
          ? ({
              "--leftStop": `${(8 / containerWidth) * 100}%`,
              "--rightStop": `calc(100% - var(--leftStop))`,
              maskImage:
                "linear-gradient(to right, transparent 0%, black var(--leftStop), black var(--rightStop), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black var(--leftStop), black var(--rightStop), transparent 100%)", // For WebKit browsers
            } as CSSProperties)
          : {}
      }
    >
      <div
        ref={textRef}
        className={`whitespace-nowrap ${
          isOverflowing ? "animate-scroll-text" : ""
        }`}
        style={
          {
            animationDuration: isOverflowing ? `${animationDuration}s` : "0s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            // the 0.5rem here is based off half the padding in the span below
            // (padding of value 4 is 1rem)
            "--text-width": `calc(${textWidth}px + (32px/2))`,
          } as CSSProperties
        }
      >
        <span>{text}</span>
        {isOverflowing && (
          <>
            <div
              className="text-center inline-block"
              style={{ inlineSize: "32px" }}
              ref={dividerRef}
            >
              ・
            </div>
            <span ref={dupeTextRef}>{text}</span>
          </>
        )}
      </div>
    </div>
  );
}