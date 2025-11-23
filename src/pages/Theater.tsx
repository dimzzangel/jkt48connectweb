import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Loader2, RefreshCw, Users, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TheaterShow {
  id: string;
  title: string;
  date: string;
  poster?: string;
  banner?: string;
  member_count?: number;
  url?: string;
  setlist?: {
    name: string;
    image?: string;
  };
  lineup?: string[];
  seitansai?: string[];
  graduation?: string[];
}

interface TheaterResponse {
  schedule: TheaterShow[];
}

const Theater = () => {
  const [shows, setShows] = useState<TheaterShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchTheater = async () => {
    try {
      const response = await fetch("https://api.crstlnz.my.id/api/theater?group=jkt48");
      if (!response.ok) throw new Error("Failed to fetch theater schedule");
      
      const data: TheaterResponse = await response.json();
      setShows(data.schedule || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching theater schedule:", error);
      toast({
        title: "Error",
        description: "Gagal memuat jadwal theater. Akan mencoba lagi...",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheater();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      fetchTheater();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
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
                <h1 className="text-2xl font-bold text-foreground">Jadwal Theater JKT48</h1>
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
                fetchTheater();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {shows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada jadwal theater tersedia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shows.map((show) => (
              <Card key={show.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="md:flex">
                  {(show.poster || show.banner || show.setlist?.image) && (
                    <div className="md:w-48 aspect-video md:aspect-square overflow-hidden bg-muted">
                      <img
                        src={show.poster || show.banner || show.setlist?.image}
                        alt={show.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-xl">{show.title}</CardTitle>
                          {show.setlist?.name && (
                            <Badge variant="secondary" className="font-normal">
                              {show.setlist.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(show.date)}</span>
                        </div>
                        {show.member_count !== undefined && show.member_count > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{show.member_count} members</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {show.seitansai && show.seitansai.length > 0 && (
                        <div>
                          <Badge className="mb-2 bg-pink-500/10 text-pink-500 border-pink-500/20">
                            🎂 Seitansai
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {show.seitansai.join(", ")}
                          </p>
                        </div>
                      )}
                      {show.graduation && show.graduation.length > 0 && (
                        <div>
                          <Badge className="mb-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            👋 Graduation
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {show.graduation.join(", ")}
                          </p>
                        </div>
                      )}
                      {show.lineup && show.lineup.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                            <Users className="h-4 w-4" />
                            <span>Lineup ({show.lineup.length} members)</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {show.lineup.join(", ")}
                          </p>
                        </div>
                      )}
                      {show.url && (
                        <a
                          href={`https://jkt48.com/theater/schedule/id/${show.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Button variant="outline" size="sm">
                            Lihat Detail
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Theater;
