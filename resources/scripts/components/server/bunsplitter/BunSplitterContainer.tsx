import React, { useState, useEffect } from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerContext } from '@/state/server';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import CopyOnClick from '@/components/elements/CopyOnClick';
import CreateServerModal from '@/components/server/bunsplitter/CreateServerModal';

import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import SplitterRow from '@/components/server/bunsplitter/SplitterRow';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import useSWR, { mutate } from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import http from '@/api/http';

export default () => {
    // Start of testing only
    const { search } = useLocation();
    const [refreshServers, setRefreshServers] = useState(false);
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const useruuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${useruuid}:show_all_servers`, false);

    const id = ServerContext.useStoreState((state) => state.server.data?.id);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page, refreshServers],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
        setRefreshServers(false); // Reset the refresh flag
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/server/${id}/splitter${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);
    // Above is testing only
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const externalid = ServerContext.useStoreState((state) => state.server.data?.externalId) || '';

    const [packageName, setPackageName] = useState<string | null>(null);
    const [serverRam, setServerRam] = useState<string | null>(null);
    const [serverDisk, setServerDisk] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [splitterLimit, setSplitterLimit] = useState<string | null>(null);
    const [splitterCount, setSplitterCount] = useState<string | null>(null);

    const refreshServerDetails = () => {
        if (!externalid) {
            // || externalid?.toString().includes('sub')
            //console.log('External ID is blank or contains "sub". Skipping API call.');
            setErrorMessage('Not a WHMCS server');
            return;
        }

        setIsLoading(true); // Set loading to true when starting the fetch operation

        http.get(`/api/client/servers/${uuid}/splitter/getinfo`)
            .then((response) => {
                console.log('😭Received getInfo data:', response.data);
                setPackageName(response.data.info.name + ' MiB');
                setServerRam(response.data.info.configoption3 + ' MiB');
                setServerDisk(response.data.info.configoption2 + ' MiB');
                setSplitterLimit((parseInt(response.data.info.configoption3) / 1024 / 2).toString());
            })
            .catch((error) => {
                setErrorMessage('😭 Unable to connect to WHMCS cache');
                console.error('There has been a problem with your fetch operation:', error);
            })
            .finally(() => {
                setIsLoading(false); // Set loading to false when fetch operation has completed
            });

        http.get(`/api/client/splitter/bird`)
            .then((response) => {
                console.log('BIRDS Received BIRDS data:', response.data);
            })
            .catch((error) => {
                console.error('There has been a problem with your fetch operation:', error);
            })
            .finally(() => {
                setIsLoading(false); // Set loading to false when fetch operation has completed
            });

        http.get(`/api/client/`)
            .then((response) => {
                //console.log('Received data:', response.data);
                const subServerCount = response.data.data.filter(
                    (server: { attributes: { external_id: string | string[] } }) =>
                        server.attributes.external_id.includes(externalid.toString() + 'sub')
                ).length;
                setSplitterCount(subServerCount);
            })
            .catch((error) => {
                console.error('There has been a problem with your fetch operation:', error);
            })
            .finally(() => {
                setIsLoading(false); // Set loading to false when fetch operation has completed
            });
    };

    useEffect(refreshServerDetails, []);

    return (
        <ServerContentBlock title={'Splitter'}>
            <div css={tw`mb-6 md:mb-10`}>
                {rootAdmin && (
                    <div css={tw`mb-2 flex justify-end items-center`}>
                        <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
                            {showOnlyAdmin ? "Showing others' servers" : 'Showing your servers'}
                        </p>
                        <Switch
                            name={'show_all_servers'}
                            defaultChecked={showOnlyAdmin}
                            onChange={() => setShowOnlyAdmin((s) => !s)}
                        />
                    </div>
                )}
                {!servers ? (
                    <Spinner centered size={'large'} />
                ) : (
                    <Pagination data={servers} onPageSelect={setPage}>
                        {({ items }) =>
                            items.filter((server) => String(server.externalId).includes(externalid?.toString() || ''))
                                .length > 0 ? (
                                items
                                    .filter((server) =>
                                        String(server.externalId).includes(externalid?.toString() || '')
                                    )
                                    .map((server, index) => (
                                        <SplitterRow
                                            key={server.uuid}
                                            server={server}
                                            css={index > 0 ? tw`mt-2` : undefined}
                                            refreshServerList={() =>
                                                mutate([
                                                    '/api/client/servers',
                                                    showOnlyAdmin && rootAdmin,
                                                    page,
                                                    refreshServers,
                                                ])
                                            }
                                            refreshServerDetails={refreshServerDetails}
                                        />
                                    ))
                            ) : (
                                <p css={tw`text-center text-sm text-neutral-400`}>
                                    {showOnlyAdmin
                                        ? 'There are no other containers to display.'
                                        : 'There are no subcontainers associated with your account.'}
                                </p>
                            )
                        }
                    </Pagination>
                )}
                <div css={tw`mt-6 sm:flex items-center justify-end`}>
                    <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                        {splitterCount} of {splitterLimit} splits have been created for this server.
                    </p>
                    {(Number(splitterLimit) || 0) > 0 &&
                        (Number(splitterLimit) || 0) > (Number(splitterCount) || 0) &&
                        !externalid?.toString().includes('sub') && (
                            <CreateServerModal
                                refreshServerList={() =>
                                    mutate(['/api/client/servers', showOnlyAdmin && rootAdmin, page, refreshServers])
                                }
                                refreshServerDetails={refreshServerDetails}
                                externalid={externalid.toString()}
                            />
                        )}
                </div>
            </div>

            <FlashMessageRender byKey={'splitter'} css={tw`mb-4`} />
            <div css={tw`md:flex`}></div>
            <div css={tw`md:flex`}>
                {/* <div css={tw`w-full md:flex-1`}>
                    <TitledGreyBox title={'Splitter Statistics'} css={tw`mb-6 md:mb-10 md:mr-10`}>
                        <div>
                            <Label>Server Address</Label>
                        </div>
                    </TitledGreyBox>
                </div> */}
                <div css={tw`w-full md:flex-1`}>
                    <TitledGreyBox title={'Splitter Debug Information'} css={tw`mb-6 md:mb-10`}>
                        <div css={tw`flex items-center justify-between text-sm`}>
                            <p>Node</p>
                            <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{node}</code>
                        </div>
                        <div css={tw`flex items-center justify-between text-sm mt-2`}>
                            <p>Type</p>
                            <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                {' '}
                                {!externalid?.toString().includes('sub') ? (
                                    <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>primary</code>
                                ) : (
                                    <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>sub</code>
                                )}
                            </code>
                        </div>
                        <div css={tw`flex items-center justify-between text-sm mt-2`}>
                            <p>External ID</p>
                            <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                {externalid ? (
                                    <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{externalid}</code>
                                ) : (
                                    <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{'none'}</code>
                                )}
                            </code>
                        </div>
                        <div css={tw`flex items-center justify-between text-sm mt-2`}>
                            <p>Original RAM</p>
                            {isLoading ? (
                                'Loading...' // This will be displayed while isLoading is true
                            ) : (
                                <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                    {errorMessage ? <div>{errorMessage}</div> : <div>{serverRam}</div>}
                                </code>
                            )}
                        </div>
                        <div css={tw`flex items-center justify-between text-sm mt-2`}>
                            <p>Original Disk</p>
                            {isLoading ? (
                                'Loading...' // This will be displayed while isLoading is true
                            ) : (
                                <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                    {errorMessage ? <div>{errorMessage}</div> : <div>{serverDisk}</div>}
                                </code>
                            )}
                        </div>
                        <div css={tw`flex items-center justify-between text-sm mt-2`}>
                            <p>Package Name</p>
                            {isLoading ? (
                                'Loading...' // This will be displayed while isLoading is true
                            ) : (
                                <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>
                                    {errorMessage ? <div>{errorMessage}</div> : <div>{packageName}</div>}
                                </code>
                            )}
                        </div>
                        <CopyOnClick text={uuid}>
                            <div css={tw`flex items-center justify-between mt-2 text-sm`}>
                                <p>Container ID</p>
                                <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{uuid}</code>
                            </div>
                        </CopyOnClick>
                    </TitledGreyBox>
                </div>
            </div>
        </ServerContentBlock>
    );
};
