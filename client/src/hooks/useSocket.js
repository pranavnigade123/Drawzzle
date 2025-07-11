import { useEffect } from 'react';
import socket from '../sockets/lobby';

export const useSocket = (events) => {
  useEffect(() => {
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
    return () => {
      Object.keys(events).forEach((event) => socket.off(event));
    };
  }, [events]);
};