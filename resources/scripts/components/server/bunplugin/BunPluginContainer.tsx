import React, { useEffect, useState } from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Switch from '@/components/elements/Switch';
import AvailablePlugins from './AvailablePlugins';
import InstalledPlugins from './InstalledPlugins';
import http from '@/api/http';
import tw from 'twin.macro';

const BunPluginContainer = () => {
    const [showInstalledPlugins, setShowInstalledPlugins] = useState(false);

    return (
        <ServerContentBlock title={'Plugins'}>
            <div css={tw`mb-2 flex justify-end items-center`}>
                <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
                    {showInstalledPlugins ? 'Showing installed plugins' : 'Showing all plugins'}
                </p>
                <Switch
                    name={'show_installed_plugins'}
                    defaultChecked={showInstalledPlugins}
                    onChange={() => setShowInstalledPlugins((s) => !s)}
                />
            </div>
            {showInstalledPlugins ? <InstalledPlugins /> : <AvailablePlugins />}
        </ServerContentBlock>
    );
};

export default BunPluginContainer;
