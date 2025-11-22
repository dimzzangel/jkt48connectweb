import { useEffect, useState } from "react";
import { StreamMember, APIStream } from "@/types/stream";
import LiveCard from "@/components/LiveCard";
import { Loader2, Radio, Menu, Play } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MultiViewerDialog } from "@/components/MultiViewerDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const Index = () => {
  const [liveStreams, setLiveStreams] = useState<StreamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [multiViewerOpen, setMultiViewerOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { unreadCount } = useUnreadMessages();

  // Check if user is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout berhasil",
      description: "Anda telah keluar dari akun",
    });
  };

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = (memberName: string, platform: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`${memberName} sedang live!`, {
        body: `${memberName} sedang live di ${platform}`,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  };

  const fetchLiveStreams = async () => {
    try {
      const response = await fetch("https://aictkzpcfcpzbjdlbkou.functions.supabase.co/now_live?group=jkt48");
      const data: APIStream[] = await response.json();
      
      // Transform API data to StreamMember format
      const newStreams: StreamMember[] = data.map((stream) => {
        if (stream.type === "youtube") {
          return {
            room_id: Math.random(), // YouTube doesn't have room_id
            name: stream.channelTitle,
            image: stream.thumbnails.high.url,
            url: stream.url,
            streaming_url: stream.url,
            started_at: new Date().toISOString(), // YouTube doesn't provide started_at
            type: "youtube",
            title: stream.title || undefined,
            is_live: true,
          };
        } else if (stream.type === "idn") {
          // Extract title from slug - remove numbers and format
          const titleFromSlug = stream.slug
            ? stream.slug
                .replace(/-\d+$/, "") // Remove trailing numbers like -123
                .replace(/-/g, " ") // Replace dashes with spaces
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
                .join(" ")
            : undefined;
          
          return {
            room_id: stream.room_id,
            name: stream.name,
            image: stream.img,
            url: `https://www.idn.media/lives/${stream.url_key}`,
            streaming_url: stream.streaming_url_list[0]?.url,
            started_at: stream.started_at,
            type: "idn",
            title: titleFromSlug,
            is_live: true,
          };
        } else {
          // showroom
          return {
            room_id: stream.room_id,
            name: stream.name,
            image: stream.image,
            url: stream.url,
            streaming_url: stream.url,
            started_at: stream.started_at,
            type: "showroom",
            title: undefined,
            is_live: true,
          };
        }
      });
      
      // Check if there are new streams and send notifications
      if (liveStreams.length > 0) {
        const previousStreamIds = new Set(liveStreams.map(s => s.room_id));
        const newlyLiveStreams = newStreams.filter(s => !previousStreamIds.has(s.room_id));
        
        newlyLiveStreams.forEach((stream) => {
          const platformName = stream.type === "youtube" ? "YouTube" : 
                               stream.type === "idn" ? "IDN Live" : "Showroom";
          
          // Send browser notification
          sendNotification(stream.name, platformName);
          
          // Also show toast
          toast({
            title: "New Live Stream! 🎉",
            description: `${stream.name} sedang live di ${platformName}!`,
          });
        });
      }
      
      setLiveStreams(newStreams);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      toast({
        title: "Error",
        description: "Failed to fetch live streams. Retrying...",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLiveStreams();

    // Set up polling every 1 minute (60000ms)
    const interval = setInterval(() => {
      fetchLiveStreams();
    }, 60000);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              JKT48 Connect
            </h1>
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover-scale">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="animate-slide-in-right">
                  <div className="flex flex-col gap-4 mt-8">
                    <NavLink to="/" className="text-lg hover:text-primary transition-colors">
                      Halaman Utama
                    </NavLink>
                    {isLoggedIn ? (
                      <>
                        <div className="relative">
                          <NavLink to="/chat" className="text-lg hover:text-primary transition-colors flex items-center gap-2">
                            Public Chat
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2 animate-scale-in">
                                {unreadCount}
                              </Badge>
                            )}
                          </NavLink>
                        </div>
                        <Button onClick={handleLogout} variant="outline" className="w-full hover-scale">
                          Logout
                        </Button>
                      </>
                    ) : (
                      <NavLink to="/auth" className="text-lg hover:text-primary transition-colors">
                        Login / Daftar
                      </NavLink>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="mb-8 flex items-center justify-between bg-card border border-border rounded-lg p-4 animate-fade-in">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Currently Live</p>
              <p className="text-2xl font-bold text-foreground">{liveStreams.length}</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium text-foreground">
                {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading live streams...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && liveStreams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="bg-muted rounded-full p-6 mb-4 animate-scale-in">
              <Radio className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Live Streams</h2>
            <p className="text-muted-foreground max-w-md">
              Gaada yang lagi live😭. cek lagi nanti ya! 
            </p>
          </div>
        )}

        {/* Live Streams Grid */}
        {!loading && liveStreams.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {liveStreams.map((stream) => (
              <LiveCard key={stream.room_id} member={stream} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-6 animate-fade-in">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Website Fanmade • Nov 2025</p>
          <p className="mt-2">copyright © Wotsnite48 2025</p>
          <p className="text-xs mt-1">created by dimzz</p>
        </div>
      </footer>

      {/* Multi-Viewer FAB */}
      <Button
        onClick={() => setMultiViewerOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg hover-scale"
        size="icon"
      >
        <Play className="h-6 w-6 text-white fill-white" />
      </Button>

      {/* Multi-Viewer Dialog */}
      <MultiViewerDialog open={multiViewerOpen} onOpenChange={setMultiViewerOpen} />
    </div>
  );
};

export default Index;
