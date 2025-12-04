
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface Announcement {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

export function AnnouncementDisplay() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const checkAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements');
        const data = await res.json();
        if (data.announcements && data.announcements.length > 0) {
          setAnnouncement(data.announcements[0]);
        } else {
          setAnnouncement(null);
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      }
    };

    // Check immediately
    checkAnnouncements();

    // Poll every second
    const interval = setInterval(checkAnnouncements, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!announcement) return null;

  return (
    <div 
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in"
      style={{ maxWidth: '600px', width: '90%' }}
    >
      <div className="bg-gradient-to-r from-primary/90 to-purple-500/90 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-lg">📢 Announcement</h3>
              <span className="text-xs text-white/70">from {announcement.username}</span>
            </div>
            <p className="text-white text-base">{announcement.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
