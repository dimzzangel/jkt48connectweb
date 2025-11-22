import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Play } from "lucide-react";
import { IDNStream, APIStream } from "@/types/stream";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { saveStreamCode } from "@/utils/streamCode";

interface MultiViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MultiViewerDialog = ({ open, onOpenChange }: MultiViewerDialogProps) => {
  const [allStreams, setAllStreams] = useState<any[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchLiveStreams();
    }
  }, [open]);

  const fetchLiveStreams = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://api.crstlnz.my.id/api/now_live?group=jkt48");
      const data: APIStream[] = await response.json();
      
      // Transform streams for multi-viewer
      const transformedStreams = data.map((stream: any) => {
        if (stream.type === "youtube") {
          const videoId = stream.url.includes("youtube.com") 
            ? new URL(stream.url).searchParams.get("v")
            : stream.url.split("/").pop();
          
          return {
            id: stream.url,
            type: "youtube",
            name: stream.channelTitle,
            img: stream.thumbnails.high.url,
            img_alt: stream.channelTitle,
            title: stream.title,
            url_key: videoId,
            streaming_url: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
          };
        } else if (stream.type === "idn") {
          const titleFromSlug = stream.slug
            ? stream.slug
                .replace(/-\d+$/, "")
                .replace(/-/g, " ")
                .split(" ")
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : undefined;
          
          return {
            id: stream.room_id,
            type: "idn",
            name: stream.name,
            img: stream.img,
            img_alt: stream.name,
            title: titleFromSlug,
            url_key: stream.url_key,
            streaming_url: stream.streaming_url_list[0]?.url,
            slug: stream.slug,
          };
        }
        return null;
      }).filter(Boolean);
      
      setAllStreams(transformedStreams);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data live streams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (urlKey: string, checked: boolean) => {
    if (checked) {
      setSelectedStreams([...selectedStreams, urlKey]);
    } else {
      setSelectedStreams(selectedStreams.filter((key) => key !== urlKey));
    }
  };

  const handleStartMultiViewer = async () => {
    if (selectedStreams.length < 2) {
      toast({
        title: "Minimal 2 Stream",
        description: "Pilih minimal 2 member untuk multi-viewer",
        variant: "destructive",
      });
      return;
    }

    try {
      const streamParams = selectedStreams.map(key => {
        const stream = allStreams.find(s => s.url_key === key);
        return {
          room_id: stream?.id,
          url: stream?.url_key
        };
      });
      
      const platformTypes = selectedStreams.map(key => {
        const stream = allStreams.find(s => s.url_key === key);
        return stream?.type || "idn";
      }).join(",");
      
      const multiViewerData = {
        type: 'multi',
        streams: streamParams,
        platforms: platformTypes
      };
      
      const code = await saveStreamCode(multiViewerData);
      navigate(`/mvm?=${code}`);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create multi-viewer link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Multi-Viewer Live</DialogTitle>
          <DialogDescription>
            Pilih minimal 2 member yang sedang live untuk ditonton bersamaan
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading live streams...</p>
          </div>
        )}

        {!loading && allStreams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada member yang live saat ini</p>
          </div>
        )}

        {!loading && allStreams.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {allStreams.map((stream) => (
                <div
                  key={stream.url_key}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={stream.url_key}
                    checked={selectedStreams.includes(stream.url_key)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(stream.url_key, checked as boolean)
                    }
                  />
                  <img
                    src={stream.img}
                    alt={stream.img_alt || stream.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{stream.name}</h3>
                    {stream.title && (
                      <p className="text-sm text-muted-foreground">{stream.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {stream.type === "youtube" ? "YouTube" : stream.type === "idn" ? "IDN Live" : "Showroom"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedStreams.length} stream dipilih
              </p>
              <Button
                onClick={handleStartMultiViewer}
                disabled={selectedStreams.length < 2}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Start Multi-Viewer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
