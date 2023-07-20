import React, { useEffect, useState } from 'react';
import http from '@/api/http';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import InstallModpackModal from './InstallModpackModal';
import { ServerContext } from '@/state/server';

interface ModpackExpandedProps {
    modId: string;
}

interface ModData {
    id: number;
    modId: number;
    displayName: string;
    releaseType: number;
    fileDate: string;
    downloadCount: number;
    gameVersions: string[];
    serverPackFileId?: number;
}

interface Pagination {
    index: number;
    pageSize: number;
    resultCount: number;
    totalCount: number;
    // Add these properties to fit PaginationFooter component
    currentPage: number;
    totalPages: number;
}

const ModpackExpanded = ({ modId }: ModpackExpandedProps) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [mods, setMods] = useState<ModData[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        index: 0,
        pageSize: 20,
        resultCount: 0,
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchMods = async (page: number) => {
        const index = (page - 1) * pagination.pageSize;
        setIsLoading(true);
        try {
            const response = await http.get('/api/client/modpacks/getmodfiles', {
                params: {
                    modId,
                    index,
                    pageSize: pagination.pageSize,
                },
            });

            // Debugging the response
            console.log('API response:', response);

            setMods(response.data.results.data);
            setPagination({
                ...response.data.results.pagination,
                index: index,
                currentPage: page,
                totalPages: Math.ceil(response.data.results.pagination.totalCount / pagination.pageSize),
            });
        } catch (error) {
            console.error('Error fetching mod data: ', error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchMods(1); // Fetch the first page on component mount
    }, [modId]);

    if (isLoading) {
        return <div>Loading...</div>;
    } else {
        return (
            <>
                <table>
                    <thead>
                        <tr>
                            <th>Mod id</th>
                            <th>Release Type</th>
                            <th>Display Name</th>
                            <th>File Date</th>
                            <th>Download Count</th>
                            <th>Game Versions</th>
                            <th>Server Pack File ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mods.map((mod) => (
                            <tr key={mod.id}>
                                <td>{mod.modId}</td>
                                <td>{mod.releaseType}</td>
                                <td>{mod.displayName}</td>
                                <td>{new Date(mod.fileDate).toLocaleDateString()}</td>
                                <td>{mod.downloadCount}</td>
                                <td>{mod.gameVersions.join(', ')}</td>
                                <td>{mod.serverPackFileId || 'N/A'}</td>
                                <td>
                                    <InstallModpackModal
                                        serverUuid={uuid}
                                        modId={mod.modId}
                                        serverPackFileId={mod.serverPackFileId}
                                        onInstallSuccess={() => {
                                            /* do something after install */
                                        }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <PaginationFooter
                    pagination={{
                        ...pagination,
                        count: mods.length,
                        total: pagination.totalCount,
                        perPage: pagination.pageSize,
                    }}
                    onPageSelect={fetchMods}
                />
            </>
        );
    }
};

export default ModpackExpanded;
