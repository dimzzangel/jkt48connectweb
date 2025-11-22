import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const LAST_READ_KEY = "chat_last_read_timestamp";

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUnreadMessages = async () => {
      const lastReadTimestamp = localStorage.getItem(LAST_READ_KEY);
      
      if (!lastReadTimestamp) {
        // If no timestamp, count all messages
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true });
        setUnreadCount(count || 0);
        return;
      }

      // Count messages after last read timestamp
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .gt("created_at", lastReadTimestamp);
      
      setUnreadCount(count || 0);
    };

    checkUnreadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("unread-messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          checkUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_READ_KEY, now);
    setUnreadCount(0);
  };

  return { unreadCount, markAsRead };
};
