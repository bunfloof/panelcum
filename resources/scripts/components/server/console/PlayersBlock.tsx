import React, { useState, useEffect } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import { Button } from '@/components/elements/button/index';

interface PlayerData {
    id: string;
    name: string;
    avatar: string;
}

export default () => {
    const [players, setPlayers] = useState<PlayerData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const serverUuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const primaryIP = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);
        return match;
    });

    const fetchPlayers = () => {
        if (primaryIP) {
            const url = `/api/client/servers/${serverUuid}/players/getplayers?server_ip=${primaryIP.ip}&server_port=${primaryIP.port}`;

            http.get(url)
                .then((response) => {
                    console.log('Response data:', response.data);
                    if (response.data.players && response.data.players.sample) {
                        setPlayers(response.data.players.sample);
                        setError(null);
                    } else {
                        setPlayers([]); // Set players to an empty array if no players are on the server
                    }
                })
                .catch((error) => {
                    console.error('Failed to fetch players:', error);
                    setError('Unable to ping server.');
                });
        }
    };

    useEffect(() => {
        fetchPlayers();
        const intervalId = setInterval(fetchPlayers, 10000); // Refresh every 10 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [primaryIP]);

    const executeCommand = (command: string) => {
        const url = `/api/client/servers/${serverUuid}/command`;

        http.post(url, { command }).catch((error) => {
            console.error('Failed to execute command:', error);
        });
    };

    const kickPlayer = (playerName: string) => {
        executeCommand(`/kick ${playerName}`);
        setTimeout(() => {
            fetchPlayers();
        }, 1000);
    };

    return (
        <div className='m-2'>
            <h1 className='font-header font-bold mb-2'>Players {players.length > 0 ? `(${players.length})` : ''}</h1>
            {error && <p className='text-red-500'>{error}</p>}
            {players.length ? (
                players.map((player, index) => (
                    <div
                        key={index}
                        className='flex justify-between items-center bg-gray-700 rounded overflow-hidden p-1 rounded mb-2 px-2'
                    >
                        <img className='w-8 h-8 rounded' src={player.avatar} alt={`${player.name}'s Avatar`} />
                        <div className='flex-1 ml-4'>
                            <p className='font-semibold'>{player.name}</p>
                            <p className='text-sm text-gray-400'>{player.id}</p>
                        </div>
                        <Button.Text onClick={() => kickPlayer(player.name)} size={Button.Sizes.Small}>
                            Kick
                        </Button.Text>
                    </div>
                ))
            ) : !error ? (
                <p>There are no players online.</p>
            ) : null}
        </div>
    );
};
