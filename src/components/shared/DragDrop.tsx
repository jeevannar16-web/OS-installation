import { useCallback, useState } from "react";
import { motion } from "framer-motion";

export function useDraggable() {
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(false);

  const onDragStart = useCallback(() => {
    setDragging(true);
  }, []);

  const onDragEnd = useCallback(() => {
    setDragging(false);
    setOver(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent, onDropAction: () => void) => {
      e.preventDefault();
      setOver(false);
      setDragging(false);
      onDropAction();
    },
    []
  );

  return { dragging, over, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop };
}

export function DraggableItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={`cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function DropTarget({
  over,
  children,
  onDragOver,
  onDragLeave,
  onDrop,
  className = "",
}: {
  over: boolean;
  children: React.ReactNode;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  className?: string;
}) {
  return (
    <motion.div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      animate={over ? { scale: 1.05, boxShadow: "0 0 30px rgba(124,92,255,0.3)" } : { scale: 1 }}
      className={`transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
}
