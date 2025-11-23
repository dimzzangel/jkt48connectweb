import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RecentStream {
  room_id?: number;
  title?: string;
  url?: string;
  image?: string;
  member?: {
    name: string;
    nickname?: string;
    img_alt?: string;
    img?: string;
  };
  live_info?: {
    date?: {
      start: string;
      end: string;
    };
    duration?: number;
    viewers?: {
      num: number;
    };
  };
  points?: number;
  type: string;
  // Fallback fields
  name?: string;
  img?: string;
  started_at?: string;
  ended_at?: string;
  channelTitle?: string;
}

interface RecentResponse {
  recent: RecentStream[];
}

const Recent = () => {
  const [streams, setStreams] = useState<RecentStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchRecent = async () => {
    try {
      const response = await fetch("https://api.crstlnz.my.id/api/recent?group=jkt48");
      if (!response.ok) throw new Error("Failed to fetch recent streams");
      
      const data: RecentResponse = await response.json();
      setStreams(data.recent || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching recent streams:", error);
      toast({
        title: "Error",
        description: "Gagal memuat riwayat stream. Akan mencoba lagi...",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(() => {
      fetchRecent();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (milliseconds?: number) => {
    if (!milliseconds) return "N/A";
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}j ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getPlatformColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "idn":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "youtube":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "showroom":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Riwayat Live Stream</h1>
                <p className="text-sm text-muted-foreground">
                  Update terakhir: {lastUpdate.toLocaleTimeString("id-ID")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                fetchRecent();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {streams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada riwayat stream tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streams.map((stream, index) => {
              const memberName = stream.member?.name || stream.name || stream.channelTitle || "Unknown";
              const thumbnail = stream.member?.img_alt || stream.image || stream.member?.img || stream.img;
              const startDate = stream.live_info?.date?.start || stream.started_at || "";
              const endDate = stream.live_info?.date?.end || stream.ended_at;
              const duration = stream.live_info?.duration;
              const viewerCount = stream.live_info?.viewers?.num;
              const giftPoints = stream.points;
              
              return (
                <Card key={`${stream.room_id || index}-${startDate}`} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt={memberName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={getPlatformColor(stream.type)}>
                        {stream.type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-3">
                    <h3 className="font-semibold text-foreground line-clamp-1">
                      {memberName}
                    </h3>
                    {stream.title && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{stream.title}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Mulai: {formatDate(startDate)}</span>
                    </div>
                    {endDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Selesai: {formatDate(endDate)}</span>
                      </div>
                    )}
                    {duration !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Durasi: {formatDuration(duration)}</span>
                      </div>
                    )}
                    {viewerCount !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Penonton: {viewerCount.toLocaleString()}</span>
                      </div>
                    )}
                    {giftPoints !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>Gift: {giftPoints.toLocaleString()} poin</span>
                      </div>
                    )}
                    {stream.url && (
                      <a
                        href={stream.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full"
                      >
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Lihat Stream
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Recent;
