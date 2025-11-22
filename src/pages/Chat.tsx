import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Send, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { markAsRead } = useUnreadMessages();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);
      
      // Get username from profiles
      supabase
        .from("profiles")
        .select("username")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUsername(data.username);
          }
        });
    });

    // Fetch initial messages
    fetchMessages();
    
    // Mark messages as read when visiting the page
    markAsRead();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((current) => current.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, markAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser) return;

    const { error } = await supabase.from("messages").insert({
      user_id: currentUser.id,
      username: username,
      message: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengirim pesan",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with Hamburger Menu */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-4 mt-8">
                <NavLink to="/">Halaman Utama</NavLink>
                <NavLink to="/chat">Public Chat</NavLink>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold">Public Chat</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <Card key={msg.id} className="p-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-primary">
                {msg.username}
              </span>
              <p className="text-sm">{msg.message}</p>
              <span className="text-xs text-muted-foreground">
                {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
