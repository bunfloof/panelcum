import React, { useEffect, useState, FunctionComponent, Ref } from 'react';
import http from '@/api/http';
import useServerPlugins from './useServerPlugins';
import Spinner from '@/components/elements/Spinner';
import DeletePluginsModal from './DeletePluginsModal';
import deleteFiles from '@/api/server/files/deleteFiles';

type PluginProps = {
    plugin: any;
    innerRef?: Ref<HTMLDivElement>;
    serveruuid: string;
};

enum PluginState {
    NotInstalled,
    Outdated,
    UpToDate,
}

const PluginRow: FunctionComponent<PluginProps> = ({ plugin, innerRef, serveruuid }) => {
    const { files, plugins, refetch } = useServerPlugins(serveruuid);
    const [isInstalling, setIsInstalling] = useState(false);
    const [pluginState, setPluginState] = useState(PluginState.NotInstalled); // make pluginState a state variable

    useEffect(() => {
        const installedPluginVersion = plugins[plugin.id]?.version;

        if (installedPluginVersion) {
            setPluginState(
                installedPluginVersion === plugin.version.id.toString() ? PluginState.UpToDate : PluginState.Outdated
            );
        } else {
            setPluginState(PluginState.NotInstalled);
        }
        console.log(`Plugin state for ${plugin.name} (${plugin.id}): `, pluginState);
        console.log(`Installed plugin data: `, plugins[plugin.id]);
    }, [plugins]); // run this effect whenever `plugins` changes

    const deleteOldVersions = async (serverUuid: string, filesToDelete: string[]) => {
        return deleteFiles(serverUuid, '/plugins', filesToDelete)
            .then(() => {
                console.log('Old versions deleted successfully');
            })
            .catch((error) => {
                console.error('Error deleting old versions:', error);
            });
    };

    const handleInstall = async () => {
        setIsInstalling(true);

        try {
            const res = await http.get(`/api/client/plugins/getdirectdownloadlink`, {
                params: {
                    url: `https://api.spiget.org/v2/resources/${plugin.id}/download`,
                },
            });

            const directUrl = res.data.url;
            console.log(directUrl);

            const cleanName = plugin.name
                .replace(/[^a-zA-Z0-9 .()]/g, '')
                .trim()
                .replace(/[ .()]+/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 32)
                .replace(/-+$/, '');

            const filename = `${cleanName}-${plugin.id}-v${plugin.version.id}${plugin.file.type}`;

            if (plugins[plugin.id]) {
                const oldFilesToDelete = files.filter((file) => file.name.includes(`-${plugin.id}-v`));
                await deleteOldVersions(
                    serveruuid,
                    oldFilesToDelete.map((file) => file.name)
                );
                console.log('Deleted old version(s) of plugin');
            }

            await http.post(`/api/client/servers/${serveruuid}/files/pull`, {
                url: directUrl,
                directory: '/plugins',
                filename: filename,
                use_header: false,
                foreground: true,
            });

            console.log('File pull successful');
            setPluginState(PluginState.UpToDate); // Update the state to cause a re-render

            refetch();
        } catch (error) {
            console.error('Error during install', error);
        } finally {
            setIsInstalling(false);
        }
    };

    useEffect(() => {
        console.log(
            `Plugin name is ${plugin.name} with plugin ID ${plugin.id} and plugin version ${plugin.version.id} and `
        );
        console.log('now loggin pljugins');
        console.log(plugins);
        console.log('now loggin files');
        console.log(files);
    }, [files, plugins]);

    return (
        <div className='w-full flex flex-col items-start justify-start' ref={innerRef}>
            <div className='flex flex-row flex-wrap items-start justify-between'>
                <div className='flex flex-row flex-wrap items-start justify-start'>
                    <div className='flex flex-col items-center justify-start'>
                        <img
                            alt=''
                            src={plugin.icon.data === '' ? `none` : `data:image/jpeg;base64, ${plugin.icon.data}`}
                            style={{ width: '64px', height: '64px' }}
                        />
                    </div>
                    <div className='flex flex-col items-start justify-start'>
                        <b>{plugin.name}</b>
                        <div className='flex flex-col items-start justify-start'>
                            <div>{plugin.tag}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='self-stretch flex flex-row flex-wrap items-center justify-end'>
                <div className='flex-1 relative'>
                    <span>{`Downloads: `}</span>
                    <span>{`${plugin.downloads}, Last Updated: ${new Date(
                        plugin.updateDate * 1000
                    ).toLocaleString()}, Created: ${new Date(plugin.releaseDate * 1000).toLocaleString()}, Rating: ${
                        plugin.rating?.average?.toFixed(1) || 'N/A'
                    }/5 from ${plugin.rating?.count || 'N/A'} reviews`}</span>
                </div>
                <div className='flex flex-row flex-wrap items-center justify-end'>
                    <button>
                        <div>Info</div>
                    </button>
                    {plugin.file.type === '.jar' && pluginState === PluginState.NotInstalled && (
                        <button onClick={handleInstall} disabled={isInstalling}>
                            {isInstalling ? <Spinner /> : <div>Install</div>}
                        </button>
                    )}
                    {pluginState === PluginState.Outdated && plugins[plugin.id] && (
                        <>
                            <button onClick={handleInstall} disabled={isInstalling}>
                                {isInstalling ? <Spinner /> : <div>Update</div>}
                            </button>
                            <DeletePluginsModal
                                serverUuid={serveruuid}
                                pluginFile={plugins[plugin.id].name}
                                relatedDirs={plugins[plugin.id]?.relatedDirs}
                                onDeleteSuccess={() => {
                                    setPluginState(PluginState.NotInstalled);
                                    refetch();
                                }}
                            />
                        </>
                    )}
                    {pluginState === PluginState.UpToDate && plugins[plugin.id] && (
                        <DeletePluginsModal
                            serverUuid={serveruuid}
                            pluginFile={plugins[plugin.id].name}
                            relatedDirs={plugins[plugin.id]?.relatedDirs}
                            onDeleteSuccess={() => {
                                setPluginState(PluginState.NotInstalled);
                                refetch();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PluginRow;
