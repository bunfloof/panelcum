import React, { useState, useMemo } from 'react';
import { ServerContext } from '@/state/server';
import useServerPlugins from './useServerPlugins';
import InstalledPluginRow from './InstalledPluginRow';
import Input from '@/components/elements/Input';

const InstalledPlugins = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { files } = useServerPlugins(uuid);
    const [searchText, setSearchText] = useState('');
    const [sortOption, setSortOption] = useState('modifiedAt');
    const [deletedPlugins, setDeletedPlugins] = useState<string[]>([]);

    const installedPlugins = files.filter((file) => file.name.endsWith('.jar'));

    const filteredAndSortedPlugins = useMemo(() => {
        return installedPlugins
            .filter((plugin) => plugin.name.toLowerCase().includes(searchText.toLowerCase()))
            .filter((plugin) => !deletedPlugins.includes(plugin.name)) // remove deleted plugins
            .sort((a, b) => {
                switch (sortOption) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'modifiedAt':
                    default:
                        return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
                }
            });
    }, [installedPlugins, searchText, sortOption, deletedPlugins]);

    const handleDelete = (pluginName: string) => {
        setDeletedPlugins((prev) => [...prev, pluginName]);
    };

    return (
        <>
            <Input type='text' placeholder='Search plugins...' onChange={(e) => setSearchText(e.target.value)} />
            <div className='self-stretch flex flex-row flex-wrap items-center justify-end'>
                <div className='flex-1 relative space-x-4'>
                    <span>Sort by:</span>
                    <span
                        className={`${
                            sortOption === 'name' ? 'text-gray-300 font-medium' : 'underline cursor-pointer'
                        }`}
                        onClick={() => sortOption !== 'name' && setSortOption('name')}
                    >
                        Name
                    </span>
                    <span
                        className={`${
                            sortOption === 'modifiedAt' ? 'text-gray-300 font-medium' : 'underline cursor-pointer'
                        }`}
                        onClick={() => sortOption !== 'modifiedAt' && setSortOption('modifiedAt')}
                    >
                        Modified date
                    </span>
                </div>
                <div className='flex flex-row flex-wrap items-center justify-end'>
                    <h2>{`${installedPlugins.length} installed plugins`}</h2>
                </div>
            </div>

            <ul className='bg-gray-700'>
                {filteredAndSortedPlugins.map((pluginfile) => (
                    <li
                        key={pluginfile.name}
                        className='border-b-2 border-gray-800 last:rounded-b last:border-0 group p-2'
                    >
                        <InstalledPluginRow serveruuid={uuid} pluginfile={pluginfile} onDelete={handleDelete} />
                    </li>
                ))}
            </ul>
        </>
    );
};

export default InstalledPlugins;
