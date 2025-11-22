import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getStreamData } from "@/utils/streamCode";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";


const Player = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [embedUrl, setEmbedUrl] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [streamCode, setStreamCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const loadStream = async () => {
      const code = searchParams.toString().replace("=", "");
      
      if (!code) {
        setError(true);
        setLoading(false);
        return;
      }

      setStreamCode(code);

      const data = await getStreamData(code);
      
      if (!data) {
        setError(true);
        setLoading(false);
        return;
      }

      // Update meta tags
      document.title = `${data.name} - Live | JKT48 Connect`;

      if (data.type === "youtube") {
        // Extract video ID from URL
        const videoId = data.url.includes("v=") 
          ? data.url.split("v=")[1].split("&")[0]
          : data.url.split("/").pop();
        setEmbedUrl(`https://www.youtube.com/embed/${videoId}`);
        setDescription(data.description || data.title || "");
      } else if (data.type === "idn") {
        // Use streaming_url from data for IDN
        setEmbedUrl(data.streaming_url || "");
        // Remove numbers from slug for description
        const slug = data.slug || "";
        const cleanDescription = slug.replace(/^\d+\s*-\s*/, "").replace(/-/g, " ");
        setDescription(cleanDescription);
      } else if (data.type === "showroom") {
        setEmbedUrl(data.url);
        setDescription(data.title || "");
      }

      setStreamData(data);
      setLoading(false);
    };

    loadStream();
  }, [searchParams]);

  const getPlatformColor = () => {
    switch (streamData?.type) {
      case "youtube":
        return "bg-red-600 text-white";
      case "idn":
        return "bg-blue-600 text-white";
      case "showroom":
        return "bg-pink-600 text-white";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  const getPlatformName = () => {
    switch (streamData?.type) {
      case "youtube":
        return "YouTube";
      case "idn":
        return "IDN Live";
      case "showroom":
        return "Showroom";
      default:
        return streamData?.type?.toUpperCase();
    }
  };

  const getShareUrl = () => {
    return `/stream?=${streamCode}`;
  };
 
  const getEmbedCode = () => {
    const shareUrl = getShareUrl();
    return `<iframe src="${shareUrl}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Berhasil disalin!",
      description: "Link telah disalin ke clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95">
        <div className="text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-4">Live Stream Tidak Ditemukan</h2>
          <p className="text-muted-foreground mb-6">Member sudah selesai live atau link tidak valid</p>
          <Button onClick={() => navigate("/")} className="hover-scale">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 hover-scale"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>

            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hover-scale">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md animate-scale-in">
                <DialogHeader>
                  <DialogTitle>Share Live Stream</DialogTitle>
                  <DialogDescription>
                    Bagikan link live stream ini dengan temanmu
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Share Link
                    </label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={getShareUrl()}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(getShareUrl())}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Embed Code
                    </label>
                    <div className="flex gap-2">
                      <Textarea
                        readOnly
                        value={getEmbedCode()}
                        className="flex-1 font-mono text-xs"
                        rows={3}
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(getEmbedCode())}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="overflow-hidden border-2 animate-fade-in">
            <CardContent className="p-0">
              <AspectRatio ratio={16 / 9} className="bg-black">
                {streamData.type === "youtube" ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : streamData.type === "idn" ? (
                  <video
                    src={embedUrl}
                    className="w-full h-full"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </AspectRatio>
            </CardContent>
          </Card>

          {/* Stream Info Below Player */}
          <Card className="mt-6 overflow-hidden border-2 animate-fade-in bg-gradient-to-br from-card to-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 animate-scale-in">
                    <img 
                      src={streamData.image} 
                      alt={streamData.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${getPlatformColor()} animate-scale-in`}>
                      {getPlatformName()}
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 animate-scale-in">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                      LIVE
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      {streamData.name}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {description || streamData.title || streamData.slug || "No description available"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Player;
