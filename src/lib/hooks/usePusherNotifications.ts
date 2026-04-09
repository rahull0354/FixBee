'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { subscribeToChannel, unsubscribeFromChannel } from '@/lib/pusher';
import { toast } from 'sonner';

export interface PusherNotification {
  type: string;
  data: any;
  timestamp: Date;
}

export const usePusherNotifications = (
  userId: string | undefined,
  userType: 'customer' | 'provider' | 'admin'
) => {
  const [notifications, setNotifications] = useState<PusherNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to user-specific channel
    const channelName = `${userType}-${userId}`;

    const channel = subscribeToChannel(channelName);
    channelRef.current = channel;

    // Listen for all notification events
    const events = [
      'request.created',
      'request.accepted',
      'request.cancelled',
      'request.rescheduled',
      'request.started',
      'request.completed',
      'payment.initiated',
      'payment.completed',
      'payment.failed',
      'payout.initiated',
      'payout.processed',
      'payout.completed',
      'payout.failed',
      'review.new',
      'review.reply',
      'notification.new',
    ];

    const handleNotification = (data: any) => {
      const notification: PusherNotification = {
        type: data.type || 'notification',
        data: data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      showToast(notification);
    };

    // Bind to all events
    events.forEach((event) => {
      channel.bind(event, handleNotification);
    });

    // Listen to all events for debugging
    channel.bind_global((eventName: string, data: any) => {
    });

    return () => {
      // Unbind from all events
      events.forEach((event) => {
        channel.unbind(event, handleNotification);
      });
      unsubscribeFromChannel(channelName);
    };
  }, [userId, userType]);

  const showToast = (notification: PusherNotification) => {
    const { type, data } = notification;

    switch (type) {
      case 'request.created':
        toast.success(`New service request: ${data.title || 'Service Request'}`, {
          description: 'A customer has requested your service',
        });
        break;
      case 'request.accepted':
      case 'request_assigned':
        toast.success('Request accepted!', {
          description: `${data.providerName || data.data?.providerName || 'A provider'} has accepted your service request`,
        });
        break;
      case 'request.started':
        toast.info('Service started', {
          description: 'Provider has started working on your request',
        });
        break;
      case 'request.completed':
        toast.success('Service completed!', {
          description: 'Your service has been completed successfully',
        });
        break;
      case 'request.cancelled':
      case 'request_cancelled':
        toast.error('Request cancelled', {
          description: data.message || 'Service request has been cancelled',
        });
        break;
      case 'request.rescheduled':
      case 'request_rescheduled':
        toast.info('Request rescheduled', {
          description: data.message || 'Service request has been rescheduled',
        });
        break;
      case 'payment.completed':
        toast.success('Payment completed', {
          description: `₹${data.amount || '0'} payment successful`,
        });
        break;
      case 'payment.failed':
        toast.error('Payment failed', {
          description: data.message || 'Payment could not be processed',
        });
        break;
      case 'payout.completed':
      case 'payout_completed':
        toast.success('Payout completed!', {
          description: `₹${data.data?.amount || data.amount || '0'} has been transferred to your account${data.data?.utr ? `. UTR: ${data.data.utr}` : ''}`,
        });
        break;
      case 'payout.initiated':
      case 'payout_initiated':
        toast.info('Payout initiated', {
          description: `₹${data.data?.amount || data.amount || '0'} for ${data.data?.invoiceCount || data.invoiceCount || '0'} invoice(s) has been initiated`,
        });
        break;
      case 'payout.processed':
      case 'payout_processed':
        toast.info('Payout being processed', {
          description: `₹${data.data?.amount || data.amount || '0'} is being processed. Amount will be credited shortly`,
        });
        break;
      case 'payout.failed':
      case 'payout_failed':
        toast.error('Payout failed', {
          description: data.data?.failureReason || data.failureReason || data.message || 'Payout could not be processed',
        });
        break;
      case 'review.new':
      case 'new_review':
        toast.success('New review received!', {
          description: `${data.data?.customerName || data.customerName || 'A customer'} left a ${data.data?.rating || data.rating || ''} star review`,
        });
        break;
      case 'review.reply':
      case 'review_reply':
        toast.success('Provider responded to your review!', {
          description: `${data.data?.providerName || data.providerName || 'A provider'} has replied to your review`,
        });
        break;
      case 'notification.new':
        toast.info(data.title || 'New notification', {
          description: data.message || 'You have a new notification',
        });
        break;
      default:
        toast.info('New notification', {
          description: 'You have a new update',
        });
    }
  };

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
  };
};
