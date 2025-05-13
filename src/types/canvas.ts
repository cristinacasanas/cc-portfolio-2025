import type { MotionValue, AnimationControls } from "framer-motion";
import type { RefObject } from "react";

export interface CanvasItem {
  id: string | number;
  image: string;
  title?: string;
  description?: string;
  variation?: {
    rotation: number;
    scale: number;
  };
}

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface CanvasGestureProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  minScale: number;
  maxScale: number;
  canvasRef: RefObject<HTMLDivElement | null>;
  controls: AnimationControls;
} 