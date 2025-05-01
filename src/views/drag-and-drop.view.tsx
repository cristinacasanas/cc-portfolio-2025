import { collection } from "@/mock/collection"
import { useState, useRef, useEffect, useCallback } from "react"
import clsx from "clsx"
import { CollectionNav } from "@/components/layout/collection.nav"
import { motion } from "framer-motion"


let STACK_ORDER = 15;

export function DragAndDropView() {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [posterPositions, setPosterPositions] = useState<Array<{ x: number, y: number }>>([])
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const dragStartPos = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [stackIndexes, setStackIndexes] = useState<Array<number>>([])


  useEffect(() => {
    // Calculate center position based on window dimensions
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Create staggered initial positions in a cascade formation
    const initialPositions = collection.slice(0, 15).map((_, index) => {
      // Create three columns of posters with slight variations
      const column = index % 3;
      const row = Math.floor(index / 3);
      
      // Base position for each column
      let baseX = centerX;
      if (column === 0) baseX -= 400;
      if (column === 2) baseX += 400;
      
      // Stagger the positions with increasing offset based on index
      return {
        x: baseX + (Math.random() * 100 - 50), 
        y: centerY - 200 + (row * 100) + (Math.random() * 60 - 30),
      }
    });
    setPosterPositions(initialPositions);
    
    // Set stacking order with higher indexes for posters that should appear on top
    const initialStackIndexes = collection.slice(0, 15).map((_, index) => 15 + index);
    setStackIndexes(initialStackIndexes);
  }, [])
  
  const handlePosterMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedIndex(index)
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    setDragOffset({
      x: e.clientX - centerX,
      y: e.clientY - centerY,
    })
    
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
    }

    const newStackIndexes = [...stackIndexes]
    newStackIndexes[index] = STACK_ORDER++
    setStackIndexes(newStackIndexes)
  }, [stackIndexes])
  
  // Handler for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedIndex === null) return
    
    // Use direct pixel positions instead of relative percentages
    setPosterPositions(prev => {
      const newPositions = [...prev]
      if (newPositions[draggedIndex]) {
        newPositions[draggedIndex] = {
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        }
      }
      return newPositions
    })
  }, [draggedIndex, dragOffset])
  
  // Handler for ending drag
  const handleMouseUp = useCallback(() => {
    setDraggedIndex(null)
  }, [])
  
  // Add global mouse event listeners
  useEffect(() => {
    if (draggedIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggedIndex, handleMouseMove, handleMouseUp])
  
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      <div 
        ref={containerRef} 
        className="absolute inset-0 overflow-hidden"
      >
        {collection.slice(0, 15).map((item, index) => {
          const position = posterPositions[index] || { x: 0, y: 0 }
          const isDragged = draggedIndex === index
          const zIndex = isDragged ? 1000 : stackIndexes[index]
          
          return (
            <motion.div
              key={index}
              // apparition progressive les unes après les autres
              initial={{ opacity: 0}}
              animate={{ opacity: 1}}
              transition={{ 
                duration: 0.5, 
                delay: 0.08 * index, 
                ease: "easeInOut" 
              }}
              className={clsx(
                "absolute",
                isDragged ? "transition-none" : "transition-all duration-200",
                "cursor-move select-none"
              )}
              style={{
                top: position.y,
                left: position.x,
                transform: `translate(-50%, -50%)`,
                zIndex,
                width: "380px"
              }}
              onMouseDown={(e) => handlePosterMouseDown(e, index)}
            >
              <img
                src={item.image}
                alt={`Poster ${index}`}
                className="w-full h-auto select-none"
                draggable={false}
                loading="lazy"
                onError={(e) => {
                  // Fallback in case of error
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=500&width=350&text=Poster"
                }}
              />
            </motion.div>
          )
        })}
      </div>
      
      <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <CollectionNav />
        </div>
      </div>
    </div>
  )
}