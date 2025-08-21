
import type { Announcement } from '@/services/announcements';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Megaphone } from 'lucide-react'; // Or another relevant icon
import { useEffect, useState } from 'react';
import { getSystemSettings } from '@/services/system-settings';
import type { SystemSettings } from '@/services/system-settings';

interface AnnouncementsCardProps {
  announcements: Announcement[];
}

export function AnnouncementsCard({ announcements }: AnnouncementsCardProps) {
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setLoadingSettings(true);
            try {
                const currentSettings = await getSystemSettings();
                setSystemSettings(currentSettings);
            } catch (error) {
                console.error("Error fetching system settings:", error);
                // Handle error (e.g., show a message)
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    }, []);
  const sortedAnnouncements = announcements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow h-full"> {/* Make card take full height */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          {loadingSettings ? "Loading..." : systemSettings?.announcementTitle}
        </CardTitle>
        {/* Optional description */}
        {/* <CardDescription>Latest news and updates.</CardDescription> */}
      </CardHeader>
      <CardContent className="h-[calc(100%-70px)]"> {/* Adjust height considering header padding */}
        {loadingSettings ? (
          <p>Loading announcement...</p>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-muted-foreground">{systemSettings?.announcementContent}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
