import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { APIStream } from "@/types/stream";
import { toast } from "@/hooks/use-toast";
import { getStreamData } from "@/utils/streamCode";

const MultiViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadStreams();
  }, []);

  const loadStreams = async () => {
    const code = searchParams.toString().replace('=', '');
    
    if (!code) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const data = await getStreamData(code);
      
      if (!data || data.type !== 'multi') {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const streamKeys = data.streams.split(",");
      const platforms = data.platforms.split(",");
      
      if (streamKeys.length < 2) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const response = await fetch("https://api.crstlnz.my.id/api/now_live?group=jkt48");
      const apiData: APIStream[] = await response.json();
      
      // Transform and filter selected streams
      const selectedStreams = streamKeys.map((key, index) => {
        const platform = platforms[index] || "idn";
        
        if (platform === "youtube") {
          const stream = apiData.find((s: any) => {
            if (s.type !== "youtube") return false;
            const videoId = s.url.includes("youtube.com") 
              ? new URL(s.url).searchParams.get("v")
              : s.url.split("/").pop();
            return videoId === key;
          });
          
          if (stream) {
            return {
              type: "youtube",
              name: (stream as any).channelTitle,
              title: (stream as any).title,
              streaming_url: `https://www.youtube.com/embed/${key}?autoplay=1`,
              url_key: key,
            };
          }
        } else {
          const stream = apiData.find((s: any) => s.type === "idn" && s.url_key === key);
          if (stream) {
            const titleFromSlug = (stream as any).slug
              ? (stream as any).slug
                  .replace(/-\d+$/, "")
                  .replace(/-/g, " ")
                  .split(" ")
                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
              : undefined;
            
            return {
              type: "idn",
              name: (stream as any).name,
              title: titleFromSlug,
              streaming_url: (stream as any).streaming_url_list[0]?.url,
              url_key: key,
              slug: (stream as any).slug,
            };
          }
        }
        return null;
      }).filter(Boolean);

      if (selectedStreams.length < 2) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStreams(selectedStreams);
    } catch (error) {
      console.error("Error loading streams:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || streams.length < 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Multi Viewer Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">Link tidak valid atau stream sudah selesai</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const getGridClass = () => {
    if (streams.length === 2) return "grid-cols-1 md:grid-cols-2";
    if (streams.length === 3) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Multi-Viewer Mode (MVM) </h1>
              <p className="text-sm text-muted-foreground">
                Menonton {streams.length} stream bersamaan
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className={`grid ${getGridClass()} gap-4`}>
          {streams.map((stream) => (
            <div
              key={stream.url_key}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              {/* Video Player */}
              <div className="relative aspect-video bg-black">
                {stream.type === "youtube" ? (
                  <iframe
                    className="w-full h-full"
                    src={stream.streaming_url}
                    title={stream.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : stream.streaming_url?.endsWith(".m3u8") ? (
                  <video
                    className="w-full h-full"
                    controls
                    autoPlay
                    muted
                    playsInline
                    src={stream.streaming_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <p>Video tidak tersedia</p>
                  </div>
                )}
              </div>

              {/* Stream Info */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    LIVE
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stream.type === "youtube" ? "YouTube" : "IDN Live"}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{stream.name}</h3>
                {stream.title && (
                  <p className="text-sm text-muted-foreground">{stream.title}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MultiViewer;
