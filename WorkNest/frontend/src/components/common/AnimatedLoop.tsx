import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnimatedLoop({ show }: { show: boolean }) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
  }, [show]);

  const handleExit = () => setShouldRender(false);

  return shouldRender ? (
    <motion.div
      className="fixed inset-0 z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={(definition: string) => {
        if (definition === "exit") handleExit();
      }}
    >
      {/* Blurred, dimmed overlay */}
      <div className="absolute inset-0 bg-opacity-40 backdrop-blur-sm z-10" />

      {/* Fullscreen video behind overlay */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover absolute inset-0 z-0"
      >
        <source src="/src/assets/focus-loop.mp4" type="video/mp4" />
      </video>
    </motion.div>
  ) : null;
}
