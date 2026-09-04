import * as React from 'react';
import { cn } from '../../lib/utils';

export const Avatar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border shadow-xs",
      className
    )}
    {...props}
  />
);

export const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  className,
  alt = '',
  ...props
}) => (
  <img
    className={cn("aspect-square h-full w-full object-cover", className)}
    alt={alt}
    {...props}
  />
);

export const AvatarFallback: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex h-full w-full items-center justify-center rounded-2xl bg-secondary text-secondary-foreground text-xs font-bold uppercase",
      className
    )}
    {...props}
  />
);
