import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const useSocket = () => {
    
    const [socket, setSocket] = useState(null);
    const authUser = useSelector(state => state.userSocket.user);

    useEffect(() => {
        if (!authUser) return;

        const newSocket = io('https://calmspace-ts-server.onrender.com/', {
            query: { userId: authUser?.id || "dixit" },
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [authUser]);

    return { socket };
};

export default useSocket;