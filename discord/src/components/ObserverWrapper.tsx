import React, { useRef, useState, useEffect, ReactNode, HTMLAttributes } from 'react';

interface ObserverWrapperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  pending?: ReactNode;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

const ObserverWrapper: React.FC<ObserverWrapperProps> = ({
  children,
  pending = null,
  root = null,
  rootMargin = '0px',
  threshold = 0.1,
  className,
  ...rest
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { root, rootMargin, threshold }
    );

    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold]);

  return (
    <div
      ref={wrapperRef}
      data-observer-wrapper
      className={className}
      {...rest}
    >
      {isVisible ? children : pending}
    </div>
  );
};

export default ObserverWrapper;
