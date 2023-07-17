import React, { useEffect, useState, FunctionComponent, Ref } from 'react';
import http from '@/api/http';
import useServerPlugins from './useServerPlugins';
import { Button } from '@/components/elements/button/index';
import Spinner from '@/components/elements/Spinner';
import DeletePluginsModal from './DeletePluginsModal';
import deleteFiles from '@/api/server/files/deleteFiles';
import ReactStars from 'react-rating-stars-component';

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

const resourceIcon =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAABI1BMVEX///8qLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzWErmOLAAAAYHRSTlMAAAEDBAYHCAkLDA0TFBUWGBkaGx4fISQ8Tk9TWVtcXl9iY2ZnaWtsbm9wcXJzdnd5e3x9f4CEho2Zmquturu9v8DBw8XNzs/Q0tPV1tfa29zd3+Dh5OXm5/H0+Pv8/f6vIEXSAAACJElEQVR42u2YZ1PCQBCGEwUVGxBRDKKI2MCGKCqi2EBjRQUbFvb//woHIsMmoXiXg3Gcfb6R27xPJhzD7UoSQRAEQRBEBRmjLN49LCqGSyIFyvwjAMDjvNIRwejKFfxwtTIqXNC/dQmIy8SAUIFr7RpM3Ky5hAlGFizxFa4XRoQIPOE8Ss0bPoQ9tgXDEfzu77c9nu17/F1Ehm3FO5ZzKO0pOVF56xPJJ3QxF3Vwx/fGcPxz3F/bmv74M1bEernihyIaSnlNGH7ASuIVLWqRIeZ49yzeOYVdr2zCu1vAO2rWzRTvnMZPn98ZkxswtoN3lDbtZBCk0J3FpE9ugi9ZRIUpBsFnfeds+uUW+DfrO+qTQVDSb/l4iY/LbRiPv3zo1SUGwZt+y16P6f+gAZLUs6dXv7EL0pO/EUymuQUAB4F2AvWgVsslADgMtooPHtYrOQUAx1PN4qeOcR23AN6P1EFruks9egcxAgA4DZgUg4ETc40tAUBGddTjHWrGWmFTAJAJ1fJDmUbrtgUAZ3OV+PBZ41UBAihng8FsGTonAPj6arokRtACEpCABH9MUOIRlLgOXgywHLxSPIJ9BkHfjMYar82wHH7Nx/e2sB7frQ1I66fnaED0Fur8N/EXnC1UtRFZzbWLz606JTsY21gLdttYayNuQEQj3oVRQvUcun5rjr/dcAkd5wwkOjrO6cJAqgsjtapiqVCICh4KEgRBEATxP/gG8FmhNvgddLwAAAAASUVORK5CYII=';

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
        //console.log(`Plugin state for ${plugin.name} (${plugin.id}): `, pluginState);
        //console.log(`Installed plugin data: `, plugins[plugin.id]);
    }, [plugins]); // run this effect whenever `plugins` changes

    const deleteOldVersions = async (serverUuid: string, filesToDelete: string[]) => {
        return deleteFiles(serverUuid, '/plugins', filesToDelete)
            .then(() => {
                //console.log('Old versions deleted successfully');
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
            //console.log(directUrl);

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
                //console.log('Deleted old version(s) of plugin');
            }

            await http.post(`/api/client/servers/${serveruuid}/files/pull`, {
                url: directUrl,
                directory: '/plugins',
                filename: filename,
                use_header: false,
                foreground: true,
            });

            //console.log('File pull successful');
            setPluginState(PluginState.UpToDate); // Update the state to cause a re-render

            refetch();
        } catch (error) {
            console.error('Error during install', error);
        } finally {
            setIsInstalling(false);
        }
    };

    return (
        <div className='w-full flex flex-col items-start justify-start' ref={innerRef}>
            <div className='flex flex-row flex-wrap items-start justify-between'>
                <div className='flex flex-row flex-wrap items-start justify-start'>
                    <div className='flex flex-col items-center justify-start rounded overflow-hidden'>
                        <img
                            alt=''
                            src={
                                plugin.icon.data === ''
                                    ? `${resourceIcon}`
                                    : `data:image/jpeg;base64, ${plugin.icon.data}`
                            }
                            style={{ width: '64px', height: '64px' }}
                        />
                    </div>
                    <div className='flex flex-col items-start justify-start ml-2'>
                        <b>{plugin.name}</b>
                        <div className='flex flex-col items-start justify-start'>
                            <div>{plugin.tag}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='self-stretch flex flex-row flex-wrap items-center justify-end'>
                <div className='flex-1 relative'>
                    <div className='flex items-center'>
                        {`Downloads: `}
                        {`${plugin.downloads}, Last Updated: ${new Date(
                            plugin.updateDate * 1000
                        ).toLocaleString()}, Created: ${new Date(
                            plugin.releaseDate * 1000
                        ).toLocaleString()}, Rating: `}
                        <ReactStars size={22} isHalf={true} value={plugin.rating?.average} edit={false} />
                        {`${plugin.rating?.average?.toFixed(1) || 'N/A'} from ${plugin.rating?.count || 'N/A'} reviews`}
                    </div>
                </div>
                <div className='flex flex-row flex-wrap items-center justify-end'>
                    <Button.Text
                        onClick={() =>
                            window.open(
                                `https://www.spigotmc.org/${plugin.file.url.split('/').slice(0, -1).join('/')}/`,
                                '_blank'
                            )
                        }
                    >
                        {plugin.file.type === '.jar' ? <div>Info</div> : <div>Download</div>}
                    </Button.Text>
                    {plugin.file.type === '.jar' && pluginState === PluginState.NotInstalled && (
                        <Button.Text onClick={handleInstall} className='ml-2' disabled={isInstalling}>
                            {isInstalling ? <Spinner /> : <div>Install</div>}
                        </Button.Text>
                    )}
                    {pluginState === PluginState.Outdated && plugins[plugin.id] && (
                        <>
                            <button onClick={handleInstall} disabled={isInstalling}>
                                {isInstalling ? <Spinner /> : <div>Update</div>}
                            </button>
                            <DeletePluginsModal
                                className='ml-2'
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
                            className='ml-2'
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
