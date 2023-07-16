import React, { useEffect, useState, useMemo } from 'react';
import { ServerContext } from '@/state/server';
import useServerPlugins from './useServerPlugins';
import InstalledPluginRow from './InstalledPluginRow';
import Input from '@/components/elements/Input';

const InstalledPlugins = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { files } = useServerPlugins(uuid);
    const [plugins, setPlugins] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [sortOption, setSortOption] = useState('modifiedAt');

    const installedPlugins = files.filter((file) => file.name.endsWith('.jar'));

    const filteredAndSortedPlugins = useMemo(() => {
        return installedPlugins
            .filter((plugin) => plugin.name.toLowerCase().includes(searchText.toLowerCase()))
            .sort((a, b) => {
                switch (sortOption) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'modifiedAt':
                    default:
                        return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
                }
            });
    }, [installedPlugins, searchText, sortOption]);

    return (
        <>
            <h2>Installed Plugins</h2>
            <Input type='text' placeholder='Search plugins...' onChange={(e) => setSearchText(e.target.value)} />
            <div>
                <button onClick={() => setSortOption('name')}>Sort by name</button>
                <button onClick={() => setSortOption('modifiedAt')}>Sort by modified date</button>
            </div>
            <ul>
                {filteredAndSortedPlugins.map((pluginfile) => (
                    <li key={pluginfile.name}>
                        <InstalledPluginRow serveruuid={uuid} pluginfile={pluginfile} />
                    </li>
                ))}
            </ul>
        </>
    );
};

export default InstalledPlugins;
