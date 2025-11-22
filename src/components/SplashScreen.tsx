import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 300); // Small delay before transitioning
          return 100;
        }
        return prev + 10;
      });
    }, 200); // Speed depends on connection

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="text-center space-y-6 animate-fade-in">
        <h1 className="text-5xl font-bold text-foreground mb-2 animate-scale-in">
          JKT48 Connect
        </h1>
        <p className="text-muted-foreground text-lg animate-fade-in">
          selalu tahu, selalu terhubung dengan jkt48
        </p>
        
        <div className="flex flex-col items-center gap-4 mt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Loading... {progress}%
          </p>
        </div>
      </div>
    </div>
  );
};
