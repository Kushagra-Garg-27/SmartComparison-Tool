import { motion } from "framer-motion";
import { Package } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-10"
  >
    <div className="flex justify-center mb-3">
      {icon || <Package className="w-10 h-10 text-muted-foreground/30" />}
    </div>
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    {description && (
      <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
    )}
    {action && <div className="mt-3">{action}</div>}
  </motion.div>
);

export default EmptyState;
