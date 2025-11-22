import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds
const WHATSAPP_CHANNEL = "https://whatsapp.com/channel/0029Vb6Hf5ICHDyiSqBwQ22V";

export const InactivityNotification = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    // Check inactivity every minute
    const checkInactivity = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity >= INACTIVITY_TIME && !showNotification) {
        setShowNotification(true);
      }
    }, 60 * 1000); // Check every minute

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(checkInactivity);
    };
  }, [lastActivity, showNotification]);

  const handleJoinChannel = () => {
    window.open(WHATSAPP_CHANNEL, '_blank');
    setShowNotification(false);
    setLastActivity(Date.now()); // Reset activity timer
  };

  const handleClose = () => {
    setShowNotification(false);
    setLastActivity(Date.now()); // Reset activity timer
  };

  return (
    <Dialog open={showNotification} onOpenChange={setShowNotification}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Bergabung dengan Komunitas Kami!
          </DialogTitle>
          <DialogDescription className="pt-4">
            Jangan lewatkan update terbaru! Bergabunglah dengan saluran WhatsApp official kami untuk mendapatkan notifikasi live stream, berita terbaru, dan konten eksklusif lainnya.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={handleJoinChannel}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Gabung Sekarang
          </Button>
          <Button 
            onClick={handleClose}
            variant="outline"
            className="w-full"
          >
            Nanti Saja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
