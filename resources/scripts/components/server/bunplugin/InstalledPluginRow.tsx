import React, { useEffect, useState, FunctionComponent } from 'react';
import http from '@/api/http';
import useServerPlugins from './useServerPlugins';
import { Button } from '@/components/elements/button/index';
import Spinner from '@/components/elements/Spinner';
import DeletePluginsModal from './DeletePluginsModal';
import deleteFiles from '@/api/server/files/deleteFiles';
import ReactStars from 'react-rating-stars-component';

type InstalledPluginProps = {
    serveruuid: string;
    pluginfile: any;
    onDelete: (pluginName: string) => void; // new prop
};
enum PluginState {
    NotInstalled,
    Outdated,
    UpToDate,
}

const resourceIcon =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAMAAADVRocKAAABI1BMVEX///8qLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzUqLzWErmOLAAAAYHRSTlMAAAEDBAYHCAkLDA0TFBUWGBkaGx4fISQ8Tk9TWVtcXl9iY2ZnaWtsbm9wcXJzdnd5e3x9f4CEho2Zmquturu9v8DBw8XNzs/Q0tPV1tfa29zd3+Dh5OXm5/H0+Pv8/f6vIEXSAAACJElEQVR42u2YZ1PCQBCGEwUVGxBRDKKI2MCGKCqi2EBjRQUbFvb//woHIsMmoXiXg3Gcfb6R27xPJhzD7UoSQRAEQRBEBRmjLN49LCqGSyIFyvwjAMDjvNIRwejKFfxwtTIqXNC/dQmIy8SAUIFr7RpM3Ky5hAlGFizxFa4XRoQIPOE8Ss0bPoQ9tgXDEfzu77c9nu17/F1Ehm3FO5ZzKO0pOVF56xPJJ3QxF3Vwx/fGcPxz3F/bmv74M1bEernihyIaSnlNGH7ASuIVLWqRIeZ49yzeOYVdr2zCu1vAO2rWzRTvnMZPn98ZkxswtoN3lDbtZBCk0J3FpE9ugi9ZRIUpBsFnfeds+uUW+DfrO+qTQVDSb/l4iY/LbRiPv3zo1SUGwZt+y16P6f+gAZLUs6dXv7EL0pO/EUymuQUAB4F2AvWgVsslADgMtooPHtYrOQUAx1PN4qeOcR23AN6P1EFruks9egcxAgA4DZgUg4ETc40tAUBGddTjHWrGWmFTAJAJ1fJDmUbrtgUAZ3OV+PBZ41UBAihng8FsGTonAPj6arokRtACEpCABH9MUOIRlLgOXgywHLxSPIJ9BkHfjMYar82wHH7Nx/e2sB7frQ1I66fnaED0Fur8N/EXnC1UtRFZzbWLz606JTsY21gLdttYayNuQEQj3oVRQvUcun5rjr/dcAkd5wwkOjrO6cJAqgsjtapiqVCICh4KEgRBEATxP/gG8FmhNvgddLwAAAAASUVORK5CYII=';

const InstalledPluginRow: FunctionComponent<InstalledPluginProps> = ({ pluginfile, serveruuid, onDelete }) => {
    const { files, plugins, refetch } = useServerPlugins(serveruuid);
    const [pluginData, setPluginData] = useState<any>(null);
    const [pluginState, setPluginState] = useState(PluginState.NotInstalled);
    const [isDeleted, setIsDeleted] = useState(false);

    const [isInstalling, setIsInstalling] = useState(false);

    // from useServerPlugins.tsx
    const parseFilename = (filename: string): { id: string; version: string; name: string } | null => {
        const match = filename.match(/^(.*?)-(\d+)-v(\d+)\.jar$/);
        if (match) {
            return { name: match[1], id: match[2], version: match[3] };
        } else {
            const match = filename.match(/^(.*?)(?:-v(\d+))?.jar$/);
            if (match) {
                return {
                    name: match[1],
                    id: filename,
                    version: `000000`,
                };
            }
        }
        return null;
    };
    // end of from userServerPlugins.tsx
    const parsedData = parseFilename(pluginfile.name);

    const fetchResourceDetails = async (id: string, version: string, isMounted: () => boolean) => {
        if (parsedData && version === '000000') return;
        try {
            const { data } = await http.get('/api/client/plugins/getresourcedetails', {
                params: {
                    resource: id,
                },
            });

            // Only update state if the component is still mounted
            if (isMounted()) {
                setPluginData(data.results);
            }
        } catch (e) {
            if (isMounted()) {
                console.error('Failed to fetch resource details: ', e);
            }
        }
    };

    useEffect(() => {
        let isMounted = true; // Added this line
        console.log("here's our pluginfile");
        console.log(pluginfile);
        // if (Object.keys(plugins).length > 0) {
        //     console.log('all of our plugins');
        // }
        if (parsedData) fetchResourceDetails(parsedData.id, parsedData.version, () => isMounted);

        // Cleanup function

        // console.log('now logging the parsed data');
        console.log(pluginData);
        // console.log('now logging plugins');
        // console.log(plugins);

        return () => {
            isMounted = false;
        };
    }, [plugins]);

    useEffect(() => {
        if (pluginData) {
            const installedPluginVersion = plugins[pluginData.id]?.version;
            if (installedPluginVersion) {
                console.log(`comparign ${installedPluginVersion} to ${pluginData.version.id.toString()}!!!!!`);
                setPluginState(
                    installedPluginVersion === pluginData.version.id.toString()
                        ? PluginState.UpToDate
                        : PluginState.Outdated
                );
            } else {
                setPluginState(PluginState.NotInstalled);
            }
        }
    }, [pluginData]);

    if (isDeleted) {
        return null;
    }
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
        if (!parsedData || (pluginData && parsedData && parsedData.version === '000000')) return;
        try {
            const res = await http.get(`/api/client/plugins/getdirectdownloadlink`, {
                params: {
                    url: `https://api.spiget.org/v2/resources/${parsedData.id}/download`,
                },
            });

            const directUrl = res.data.url;
            //console.log(directUrl);

            const cleanName = pluginfile.name
                .replace(/[^a-zA-Z0-9 .()]/g, '')
                .trim()
                .replace(/[ .()]+/g, '-')
                .replace(/-+/g, '-')
                .substring(0, 32)
                .replace(/-+$/, '');

            const filename = `${cleanName}-${pluginData.id}-v${pluginData.version.id}${pluginData.file.type}`;

            if (plugins[pluginData.id]) {
                const oldFilesToDelete = files.filter((file) => file.name.includes(`-${pluginData.id}-v`));
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
        <div className='w-full flex flex-col items-start justify-start'>
            <div className='flex flex-row flex-wrap items-start justify-between'>
                <div className='flex flex-row flex-wrap items-start justify-start'>
                    <div className='flex flex-col items-center justify-start rounded overflow-hidden'>
                        <img
                            alt=''
                            src={
                                pluginData?.icon?.data === undefined
                                    ? `${resourceIcon}`
                                    : `data:image/jpeg;base64, ${pluginData.icon.data}`
                            }
                            style={{ width: '64px', height: '64px' }}
                        />
                    </div>

                    <div className='flex flex-col items-start justify-start ml-2'>
                        <b>{pluginData?.name || pluginfile.name}</b>
                        <div className='flex flex-col items-start justify-start'>
                            <div>{pluginData?.tag}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='self-stretch flex flex-row flex-wrap items-center justify-end'>
                <div className='flex-1 relative'>
                    <div className='flex items-center'>
                        {pluginData ? (
                            <>
                                {`Downloads: ${pluginData?.downloads}, Last Updated: ${new Date(
                                    pluginData?.updateDate * 1000
                                ).toLocaleString()}, Created: ${new Date(
                                    pluginData?.releaseDate * 1000
                                ).toLocaleString()}, Rating: `}
                                {pluginData?.rating?.average ? (
                                    <ReactStars
                                        size={22}
                                        isHalf={true}
                                        value={pluginData.rating.average}
                                        edit={false}
                                    />
                                ) : (
                                    <span>N/A</span>
                                )}
                                <span>
                                    {pluginData?.rating?.average?.toFixed(1) || 'N/A'} from{' '}
                                    {pluginData?.rating?.count || 'N/A'} reviews
                                </span>
                            </>
                        ) : (
                            `Created at: ${new Date(pluginfile.createdAt).toLocaleString(undefined, {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}, Last Modified: ${new Date(pluginfile.modifiedAt).toLocaleString(undefined, {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}`
                        )}
                    </div>
                </div>
                <div className='flex flex-row flex-wrap items-center justify-end'>
                    {pluginData && (
                        <Button.Text
                            onClick={() =>
                                window.open(
                                    `https://www.spigotmc.org/${pluginData.file.url
                                        .split('/')
                                        .slice(0, -1)
                                        .join('/')}/`,
                                    '_blank'
                                )
                            }
                        >
                            <div>Info</div>
                        </Button.Text>
                    )}
                    {pluginState === PluginState.Outdated && (
                        <>
                            <button onClick={handleInstall} disabled={isInstalling}>
                                {isInstalling ? <Spinner /> : <div>Update</div>}
                            </button>
                        </>
                    )}

                    {parsedData && (
                        <DeletePluginsModal
                            className='ml-2'
                            serverUuid={serveruuid}
                            pluginFile={plugins[parsedData.id]?.name}
                            relatedDirs={plugins[parsedData.id]?.relatedDirs}
                            onDeleteSuccess={() => {
                                setPluginState(PluginState.NotInstalled);
                                refetch();
                                setIsDeleted(true);
                                onDelete(pluginfile.name);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstalledPluginRow;
