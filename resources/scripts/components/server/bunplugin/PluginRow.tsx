import React, { useEffect, useState, FunctionComponent, Ref } from 'react';
import http from '@/api/http';
import useServerPlugins from './useServerPlugins';
import Spinner from '@/components/elements/Spinner';

type PluginProps = {
    plugin: any;
    innerRef?: Ref<HTMLDivElement>;
    serveruuid: string;
};

// Define the state of the plugin.
enum PluginState {
    NotInstalled,
    Outdated,
    UpToDate,
}

const PluginRow: FunctionComponent<PluginProps> = ({ plugin, innerRef, serveruuid }) => {
    const { files, plugins } = useServerPlugins(serveruuid);
    const [isInstalling, setIsInstalling] = useState(false);

    // Determine the state of the plugin.
    const installedPluginVersion = plugins[plugin.id]?.version;
    let pluginState = PluginState.NotInstalled;

    if (installedPluginVersion) {
        pluginState =
            installedPluginVersion === plugin.version.id.toString() ? PluginState.UpToDate : PluginState.Outdated;
    }

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
                .replace(/[ .]/g, '-')
                .replace(/[^a-zA-Z0-9-]/g, '')
                .replace(/--+/g, '-')
                .substring(0, 32);

            const filename = `${cleanName}-${plugin.id}-v${plugin.version.id}${plugin.file.type}`;

            await http.post(`/api/client/servers/${serveruuid}/files/pull`, {
                url: directUrl,
                directory: '/plugins',
                filename: filename,
                use_header: false,
                foreground: true,
            });

            console.log('File pull successful');
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
                    {pluginState === PluginState.NotInstalled && (
                        <button onClick={handleInstall} disabled={isInstalling}>
                            {isInstalling ? <Spinner /> : <div>Install</div>}
                        </button>
                    )}
                    {pluginState === PluginState.Outdated && (
                        <button onClick={handleInstall} disabled={isInstalling}>
                            {isInstalling ? <Spinner /> : <div>Update</div>}
                        </button>
                    )}
                    {pluginState === PluginState.UpToDate && (
                        <button disabled>
                            <div>Installed</div>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PluginRow;
