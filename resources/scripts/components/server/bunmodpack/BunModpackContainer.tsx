import React, { useRef, useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import http from '@/api/http';
import ModpackRow from './ModpackRow';
import InputSpinner from '@/components/elements/InputSpinner';
import Input from '@/components/elements/Input';
import Spinner from '@/components/elements/Spinner';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import getServerStartup from '@/api/swr/getServerStartup';

interface Author {
    name: string;
}

interface Logo {
    url: string;
}

interface Modpack {
    name: string;
    authors: Author[];
    summary: string;
    downloadCount: number;
    dateCreated: string;
    dateModified: string;
    links: {
        websiteUrl: string;
    };
    logo: Logo;
    id: string;
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

const BunModpackContainer: React.FC = () => {
    const observer = useRef<IntersectionObserver | null>(null);
    const [page, setPage] = useState(0); // start from 0
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [sort, setSort] = useState(2);
    const [mods, setMods] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { data, error } = getServerStartup(uuid);
    const [currentModpackProject, setCurrentModpackProject] = useState<Modpack | null>(null);
    const [currentModpackFile, setCurrentModpackFile] = useState<ModData | null>(null);

    const debouncedSearch = useCallback(
        _.debounce((text: string) => {
            setPage(0); // reset page to 0
            setSearchText(text);
        }, 500),
        []
    );

    const lastModRef = useCallback(
        (node) => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1);
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, hasMore]
    );

    useEffect(() => {
        setMods([]);
        setHasMore(true); // reset the hasMore flag
    }, [searchText, sort]);

    useEffect(() => {
        setLoading(true);
        http.get(`/api/client/modpacks/getmodssearch`, {
            params: {
                gameId: 432,
                classId: 4471,
                sortOrder: 'desc',
                sortField: sort,
                index: page * 20, // calculate the starting index based on the page number
                pageSize: 20,
                searchFilter: searchText,
            },
        }).then((res) => {
            const data = res.data.results.data;
            setLoading(false);
            if (data.length === 0) {
                setHasMore(false);
            } else {
                setMods((prevMods) => [...prevMods, ...data]);
            }
        });
    }, [searchText, sort, page]);

    useEffect(() => {
        const fetchModProjectInfo = async (modpackProjectId: string) => {
            try {
                const response = await http.get('/api/client/modpacks/getmod', {
                    params: { modId: modpackProjectId },
                });
                console.log('Mod Info:', response.data);
                setCurrentModpackProject(response.data.result.data); // Update state with the modpack data
            } catch (err) {
                console.error('Error fetching mod project info:', err);
            }
        };

        const fetchModFileInfo = async (modpackProjectId: string, modpackFileId: string) => {
            try {
                const response = await http.get('/api/client/modpacks/getmodfile', {
                    params: { modId: modpackProjectId, fileId: modpackFileId },
                });
                console.log('Mod FileInfo:', response.data);
                setCurrentModpackFile(response.data.result.data);
            } catch (err) {
                console.error('Error fetching mod file info:', err);
            }
        };

        if (error) {
            console.error('Error fetching server startup data:', error);
        } else if (data && data.variables) {
            const modpackProjectId = data.variables.find((v) => v.envVariable === 'PROJECT_ID')?.serverValue;
            const modpackFileId = data.variables.find((v) => v.envVariable === 'VERSION_ID')?.serverValue;

            if (modpackProjectId && modpackFileId) {
                console.log('Modpack Project ID:', modpackProjectId);
                console.log('Modpack File ID:', modpackFileId);
                fetchModProjectInfo(modpackProjectId);
                fetchModFileInfo(modpackProjectId, modpackFileId);
            }
        }
    }, [data, error]);

    return (
        <ServerContentBlock title={'Modpacks'}>
            {currentModpackProject && currentModpackFile && (
                <li
                    key='currently'
                    className='border-b-2 mb-2 border-gray-800 bg-gray-700 list-none last:rounded-b last:border-0 group p-2'
                >
                    <p className='font-bold'>The Modpack is currently set to:</p>
                    <div className='flex flex-row flex-wrap items-start justify-between'>
                        <div className='flex flex-row flex-wrap items-start justify-start'>
                            <div className='flex flex-col items-center justify-start rounded overflow-hidden'>
                                <img
                                    alt={currentModpackProject.name}
                                    src={currentModpackProject.logo.url}
                                    style={{ width: '64px', height: '64px' }}
                                />
                            </div>
                            <div className='flex flex-col items-start justify-start ml-2'>
                                <b>{currentModpackFile.displayName}</b>
                                <div className='flex flex-col items-start justify-start'>
                                    <div>
                                        {currentModpackProject.summary.length > 128
                                            ? `${currentModpackProject.summary.substring(0, 128)}...`
                                            : currentModpackProject.summary}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </li>
            )}
            <InputSpinner visible={loading}>
                <Input type='text' placeholder='Search mods...' onChange={(e) => debouncedSearch(e.target.value)} />
            </InputSpinner>
            <div className='flex space-x-4'>
                <span>Sort by:</span>
                <span
                    className={`${sort === 2 ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort(2);
                        setPage(0); // reset page to 0
                    }}
                >
                    Popularity
                </span>
                <span
                    className={`${sort === 6 ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort(6);
                        setPage(0); // reset page to 0
                    }}
                >
                    Total Downloads
                </span>
                <span
                    className={`${sort === 3 ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort(3);
                        setPage(0); // reset page to 0
                    }}
                >
                    Last Updated
                </span>
            </div>
            <ul className='bg-gray-700 rounded overflow-hidden'>
                {mods.map((modpack, index) => {
                    if (mods.length === index + 1) {
                        return (
                            <li
                                key={modpack.id}
                                className='border-b-2 border-gray-800 last:rounded-b last:border-0 group p-2'
                            >
                                <ModpackRow ref={lastModRef} key={`${modpack.id}-${index}`} modpack={modpack} />
                            </li>
                        );
                    } else {
                        return (
                            <li
                                key={modpack.id}
                                className='border-b-2 border-gray-800 last:rounded-b last:border-0 group p-2'
                            >
                                <ModpackRow key={`${modpack.id}-${index}`} modpack={modpack} />
                            </li>
                        );
                    }
                })}
            </ul>

            <div className='flex justify-center items-center | m-20 | m-6'>{loading && <Spinner />}</div>
        </ServerContentBlock>
    );
};

export default BunModpackContainer;
