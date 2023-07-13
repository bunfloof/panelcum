import { useState, useEffect } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import loadDirectory from '@/api/server/files/loadDirectory';

// Fufnction to extract plugin ID and version from filename
const parseFilename = (filename: string): { id: string; version: string } | null => {
    const match = filename.match(/-(\d+)-v(\d+)\.jar$/);
    return match ? { id: match[1], version: match[2] } : null;
};

const useServerPlugins = (serveruuid: string) => {
    const [files, setFiles] = useState<FileObject[]>([]);
    const [plugins, setPlugins] = useState<{ [id: string]: { version: string } }>({});

    useEffect(() => {
        const load = async () => {
            try {
                const fetchedFiles: FileObject[] = await loadDirectory(serveruuid, '/plugins');
                setFiles(fetchedFiles);

                // Extract plugins from file list.
                const plugins: { [id: string]: { version: string } } = {};
                for (const file of fetchedFiles) {
                    const pluginData = parseFilename(file.name);
                    if (pluginData) {
                        plugins[pluginData.id] = { version: pluginData.version };
                    }
                }
                setPlugins(plugins);
            } catch (error) {
                console.error('Failed to load directory', error);
            }
        };

        load();
    }, [serveruuid]);

    return { files, plugins };
};

export default useServerPlugins;
