import Pusher from 'pusher-js';

// Initialize Pusher
let pusherInstance: Pusher | null = null;

export const getPusherInstance = () => {
  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'your-pusher-key';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';


    pusherInstance = new Pusher(key, {
      cluster: cluster,
      forceTLS: true,
    });

    // Handle connection state changes
    pusherInstance.connection.bind('state_change', (states: { current: string; previous: string }) => {
      const { current, previous } = states;
      });

    // Handle errors
    pusherInstance.connection.bind('error', (error: any) => {
      });

    // Log successful connection
    pusherInstance.connection.bind('connected', () => {
      });
  }

  return pusherInstance;
};

// Subscribe to a channel
export const subscribeToChannel = (channelName: string) => {
  const pusher = getPusherInstance();
  const channel = pusher.subscribe(channelName);

  // Log subscription events
  channel.bind('pusher:subscription_succeeded', (data: any) => {
  });

  channel.bind('pusher:subscription_error', (error: any) => {
  });

  return channel;
};

// Unsubscribe from a channel
export const unsubscribeFromChannel = (channelName: string) => {
  const pusher = getPusherInstance();
  pusher.unsubscribe(channelName);
};

// Disconnect Pusher
export const disconnectPusher = () => {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
};
