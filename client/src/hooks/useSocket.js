import { useEffect } from 'react';
import socket from '../sockets/socket';

export default function useSocket(events) {
  useEffect(() => {
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.keys(events).forEach((event) => socket.off(event));
    };
  }, [events]);
}