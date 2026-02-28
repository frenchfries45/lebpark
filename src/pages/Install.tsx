import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2, Share, Plus, MoreVertical } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-status-paid/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-status-paid" />
            </div>
            <CardTitle>App Installed!</CardTitle>
            <CardDescription>
              ParkBill is now installed on your device. You can access it from your home screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = "/"}>
              Open App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Install ParkBill</CardTitle>
          <CardDescription>
            Install the app on your device for the best experience with quick access and offline capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deferredPrompt ? (
            <Button className="w-full" size="lg" onClick={handleInstall}>
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on iOS:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                    1
                  </div>
                  <div className="flex items-center gap-2">
                    Tap the <Share className="w-4 h-4" /> Share button
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                    2
                  </div>
                  <div className="flex items-center gap-2">
                    Scroll and tap <Plus className="w-4 h-4" /> "Add to Home Screen"
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                    3
                  </div>
                  <span>Tap "Add" to confirm</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on Android:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                    1
                  </div>
                  <div className="flex items-center gap-2">
                    Tap the <MoreVertical className="w-4 h-4" /> menu button
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                    2
                  </div>
                  <span>Tap "Install app" or "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                    3
                  </div>
                  <span>Tap "Install" to confirm</span>
                </li>
              </ol>
            </div>
          )}
          
          <div className="pt-4 border-t border-border">
            <h4 className="font-medium text-sm mb-2">Benefits of installing:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Quick access from your home screen</li>
              <li>• Works offline</li>
              <li>• Faster loading times</li>
              <li>• Full-screen experience</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
