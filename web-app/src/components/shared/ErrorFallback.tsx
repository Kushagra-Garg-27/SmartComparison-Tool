import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorFallback = ({ message = "Something went wrong", onRetry }: ErrorFallbackProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-10"
  >
    <AlertTriangle className="w-10 h-10 text-destructive/60 mx-auto mb-3" />
    <p className="text-sm font-medium text-muted-foreground">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-3 text-xs text-primary hover:underline"
      >
        Try again
      </button>
    )}
  </motion.div>
);

export default ErrorFallback;
