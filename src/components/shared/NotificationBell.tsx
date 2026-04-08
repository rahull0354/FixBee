'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, ClipboardCheck, XCircle, DollarSign, AlertCircle, Star, CheckCircle, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Notification {
  type: string;
  data: any;
  timestamp: Date;
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: () => void;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && unreadCount > 0) {
      onMarkAsRead();
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request.created':
      case 'request.accepted':
      case 'request.started':
      case 'request.completed':
        return <ClipboardCheck className="h-5 w-5 text-blue-600" />;
      case 'payment.completed':
        return <IndianRupee className="h-5 w-5 text-green-600" />;
      case 'payment.failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'payout.completed':
        return <IndianRupee className="h-5 w-5 text-emerald-600" />;
      case 'payout.failed':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'review.new':
        return <Star className="h-5 w-5 text-yellow-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const { type, data } = notification;

    switch (type) {
      case 'request.created':
        return `New service request: ${data.title || 'Service Request'}`;
      case 'request.accepted':
        return 'Your service request has been accepted';
      case 'request.started':
        return 'Provider has started your service';
      case 'request.completed':
        return 'Service has been completed';
      case 'request.cancelled':
        return 'Service request has been cancelled';
      case 'request.rescheduled':
        return 'Service request has been rescheduled';
      case 'payment.completed':
        return `Payment of ₹${data.amount || '0'} completed`;
      case 'payment.failed':
        return `Payment failed: ${data.message || 'Transaction failed'}`;
      case 'payout.completed':
        return `Payout of ₹${data.amount || '0'} completed`;
      case 'payout.failed':
        return `Payout failed: ${data.message || 'Transaction failed'}`;
      case 'review.new':
        return 'You received a new review';
      case 'review.reply':
        return 'Your review has been replied to';
      default:
        return data.message || 'New notification';
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'No new notifications'}
          </p>
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
