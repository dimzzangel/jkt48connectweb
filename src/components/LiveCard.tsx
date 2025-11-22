import { StreamMember } from "@/types/stream";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { saveStreamCode } from "@/utils/streamCode";
import { toast } from "@/hooks/use-toast";

interface LiveCardProps {
  member: StreamMember;
}

const LiveCard = ({ member }: LiveCardProps) => {
  const navigate = useNavigate();

  const getPlatformColor = () => {
    switch (member.type) {
      case "youtube":
        return "bg-red-600";
      case "idn":
        return "bg-blue-600";
      case "showroom":
        return "bg-pink-600";
      default:
        return "bg-primary";
    }
  };

  const getPlatformName = () => {
    switch (member.type) {
      case "youtube":
        return "YouTube";
      case "idn":
        return "IDN Live";
      case "showroom":
        return "Showroom";
      default:
        return member.type;
    }
  };

  const handleClick = async () => {
    try {
      const streamData = {
        type: member.type,
        url: member.url,
        streaming_url: member.streaming_url,
        name: member.name,
        title: member.title,
        image: member.image,
        room_id: member.room_id,
        description: member.title,
        slug: member.title,
      };
      
      const code = await saveStreamCode(streamData);
      navigate(`/stream?=${code}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate stream link",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 animate-fade-in hover-scale cursor-pointer" onClick={handleClick}>
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        <img
          src={member.image}
          alt={member.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Live Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 animate-fade-in">
          <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-bold shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            LIVE
          </span>
        </div>

        {/* Platform Badge */}
        <div className="absolute top-3 right-3 animate-fade-in">
          <span className={`${getPlatformColor()} text-white px-2.5 py-1 rounded text-xs font-semibold shadow-lg`}>
            {getPlatformName()}
          </span>
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-primary text-primary-foreground rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-8 w-8 fill-current" />
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate text-card-foreground">
          {member.name}
        </h3>
        {member.title && (
          <p className="text-sm text-muted-foreground truncate">
            {member.title}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Started {new Date(member.started_at).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default LiveCard;
