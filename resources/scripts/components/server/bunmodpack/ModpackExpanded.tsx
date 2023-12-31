import React, { useEffect, useState, useCallback } from 'react';
import http from '@/api/http';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import InstallModpackModal from './InstallModpackModal';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';

interface ModpackExpandedProps {
    modId: string;
}

interface ModData {
    id: number;
    modId: number;
    modName: string;
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

    const fetchMods = useCallback(
        async (page: number) => {
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

                // const modsWithServerPackFileId = response.data.results.data.filter(
                //     (mod: ModData) => mod.serverPackFileId !== undefined
                // );

                // console.log(response.data.results.data)
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
        },
        [modId, pagination.pageSize]
    );

    useEffect(() => {
        fetchMods(1);
    }, [fetchMods]);

    if (isLoading) {
        return (
            <div className='w-full flex justify-center items-center | m-20 | m-6'>
                <Spinner />
            </div>
        );
    } else {
        return (
            <div className='w-full mt-2 overflow-x-auto'>
                <table className='w-full text-left border-collapse'>
                    <thead>
                        <tr>
                            <th className='bg-gray-800'>Release</th>
                            <th className='bg-gray-800'>Name</th>
                            <th className='bg-gray-800'>Date</th>
                            <th className='bg-gray-800'>Downloads</th>
                            <th className='bg-gray-800'>Versions</th>
                            <th className='bg-gray-800'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {mods.map((mod) => (
                            <tr key={mod.id} className='bg-gray-700 border-gray-800 border-b-2'>
                                <td>{mod.releaseType === 1 ? 'Recommended' : 'Beta'}</td>
                                <td>{mod.displayName}</td>
                                <td>{new Date(mod.fileDate).toLocaleDateString()}</td>
                                <td>{mod.downloadCount}</td>
                                <td>{mod.gameVersions.join(', ')}</td>
                                <td align='right'>
                                    {mod.serverPackFileId && (
                                        <InstallModpackModal
                                            serverUuid={uuid}
                                            modId={mod.modId}
                                            modName={mod.displayName}
                                            serverPackFileId={mod.serverPackFileId}
                                            className='my-1'
                                            onInstallSuccess={() => {
                                                /* do something after install */
                                            }}
                                        />
                                    )}
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
            </div>
        );
    }
};

export default ModpackExpanded;
