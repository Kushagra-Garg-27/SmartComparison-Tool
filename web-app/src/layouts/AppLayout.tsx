import { motion } from "framer-motion";
import { Sparkles, Search, List, Crown, Zap, User, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 glass-strong px-4 py-3 flex items-center justify-between"
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center glow-primary">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-none">SmartCompare</h1>
            <span className="text-[10px] text-primary font-medium">AI</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/search")}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/watchlist")}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            <List className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/deals")}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            <Crown className="w-4 h-4 text-glow-warning" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/deal-radar")}
            className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
          >
            <Zap className="w-4 h-4 text-primary" />
          </motion.button>
          <NotificationBell />

          {!loading && (
            user ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1.5 bg-accent/15 rounded-full px-2 py-1"
              >
                <div className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center">
                  <User className="w-3 h-3 text-accent" />
                </div>
                <span className="text-[10px] text-accent font-medium max-w-[60px] truncate">
                  {profile?.display_name || "Dashboard"}
                </span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/auth")}
                className="flex items-center gap-1 bg-primary/15 rounded-full px-2 py-1"
              >
                <LogIn className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary font-medium">Sign In</span>
              </motion.button>
            )
          )}

          <div className="flex items-center gap-1 bg-accent/15 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] text-accent font-medium">Live</span>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-md mx-auto px-3 py-4 space-y-4">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;
