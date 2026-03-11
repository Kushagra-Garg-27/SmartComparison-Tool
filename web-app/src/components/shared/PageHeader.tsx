import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  showNotifications?: boolean;
  children?: React.ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  icon,
  rightContent,
  showNotifications = false,
  children,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 glass-strong px-4 py-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              {icon}
              <h1 className="text-sm font-bold text-foreground">{title}</h1>
            </div>
            {subtitle && (
              <span className="text-[10px] text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showNotifications && <NotificationBell />}
          {rightContent}
        </div>
      </div>
      {children}
    </motion.div>
  );
};

export default PageHeader;
