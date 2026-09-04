import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  value: '',
  onValueChange: () => {},
});

export const Tabs: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ value, onValueChange, children, className }) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={cn("space-y-4", className)}>{children}</div>
  </TabsContext.Provider>
);

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-2xl bg-muted/70 p-1 text-muted-foreground border border-border/80 select-none",
      className
    )}
    {...props}
  />
);

export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  const { value: selectedValue, onValueChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-card text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground hover:bg-card/50",
        className
      )}
    >
      {isSelected && (
        <motion.div
          layoutId="active-tabs-indicator"
          className="absolute inset-0 rounded-xl bg-card shadow-xs -z-10"
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  const { value: selectedValue } = React.useContext(TabsContext);
  if (selectedValue !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className={cn("focus-visible:outline-none", className)}
    >
      {children}
    </motion.div>
  );
};
