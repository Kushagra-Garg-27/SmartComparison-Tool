import { motion } from "framer-motion";
import { Bell, Check, X, TrendingDown, Flame, AlertTriangle, Package } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "@/services/api/types";

const typeIcons: Record<string, typeof TrendingDown> = {
  price_drop: TrendingDown,
  deal_alert: Flame,
  restock: Package,
  warning: AlertTriangle,
};

const typeColors: Record<string, string> = {
  price_drop: "text-accent",
  deal_alert: "text-glow-warning",
  restock: "text-primary",
  warning: "text-destructive",
};

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getByUserId(20);
        setNotifications(data);
      } catch { /* ignore fetch errors silently */ }
    };

    fetchNotifications();

    // Realtime subscription for live updates
    const channel = supabase
      .channel("user-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read).map(n => n.id);
    if (unread.length === 0) return;
    await notificationService.markAllRead(unread);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!user) return null;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors relative"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive flex items-center justify-center"
          >
            <span className="text-[8px] font-bold text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </motion.div>
        )}
      </motion.button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-10 z-50 w-72 rounded-xl glass-strong border border-border/60 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/40">
              <span className="text-xs font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[11px] text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = typeIcons[n.type] || Bell;
                  const color = typeColors[n.type] || "text-muted-foreground";
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-border/20 transition-colors ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-secondary/60 flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.message}</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="p-0.5 rounded hover:bg-secondary/60 flex-shrink-0">
                          <Check className="w-3 h-3 text-accent" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
