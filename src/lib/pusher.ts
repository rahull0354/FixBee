import Pusher from 'pusher-js';

// Initialize Pusher
let pusherInstance: Pusher | null = null;

export const getPusherInstance = () => {
  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'your-pusher-key';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

    console.log('🔔 Initializing Pusher with key:', key?.substring(0, 10) + '...', 'cluster:', cluster);

    pusherInstance = new Pusher(key, {
      cluster: cluster,
      forceTLS: true,
    });

    // Handle connection state changes
    pusherInstance.connection.bind('state_change', (states: { current: string; previous: string }) => {
      const { current, previous } = states;
      console.log(`✅ Pusher state changed from ${previous} to ${current}`);
    });

    // Handle errors
    pusherInstance.connection.bind('error', (error: any) => {
      console.error('❌ Pusher connection error:', error);
    });

    // Log successful connection
    pusherInstance.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully!');
    });
  }

  return pusherInstance;
};

// Subscribe to a channel
export const subscribeToChannel = (channelName: string) => {
  const pusher = getPusherInstance();
  console.log('📡 Subscribing to Pusher channel:', channelName);
  const channel = pusher.subscribe(channelName);

  // Log subscription events
  channel.bind('pusher:subscription_succeeded', (data: any) => {
    console.log('✅ Pusher subscription succeeded:', channelName, data);
  });

  channel.bind('pusher:subscription_error', (error: any) => {
    console.error('❌ Pusher subscription error:', channelName, error);
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
