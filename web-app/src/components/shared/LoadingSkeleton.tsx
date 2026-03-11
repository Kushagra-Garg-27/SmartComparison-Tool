import { motion } from "framer-motion";

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

const LoadingSkeleton = ({ lines = 3, className = "" }: LoadingSkeletonProps) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
        className="rounded-xl bg-secondary/60 h-12"
      />
    ))}
  </div>
);

export default LoadingSkeleton;
