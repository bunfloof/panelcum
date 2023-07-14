import { useState, useEffect } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import loadDirectory from '@/api/server/files/loadDirectory';

// function extracts plugin ID and version from filename
const parseFilename = (filename: string): { id: string; version: string; name: string } | null => {
    console.log(`Parsing filename: ${filename}`);
    const match = filename.match(/^(.*?)-(\d+)-v(\d+)\.jar$/);
    console.log(`Parsed filename: `, match);
    return match ? { name: match[1], id: match[2], version: match[3] } : null;
};

// Dice's coefficient for similarity calculation
const diceCoefficient = (a: string, b: string) => {
    if (!a || !b) return 0.0;

    if (a === b) return 1.0;

    const aBigrams = new Map();
    for (let i = 0; i < a.length - 1; i++) {
        const bigram = a.substring(i, i + 2);
        const count = aBigrams.has(bigram) ? aBigrams.get(bigram) + 1 : 1;

        aBigrams.set(bigram, count);
    }

    let intersectionSize = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bigram = b.substring(i, i + 2);
        const count = aBigrams.has(bigram) ? aBigrams.get(bigram) : 0;

        if (count > 0) {
            aBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }

    return (2.0 * intersectionSize) / (a.length + b.length - 2);
};

const useServerPlugins = (serveruuid: string) => {
    const [files, setFiles] = useState<FileObject[]>([]);
    const [plugins, setPlugins] = useState<{ [id: string]: { name: string; version: string; relatedDirs: string[] } }>(
        {}
    );

    const [key, setKey] = useState(0);
    const refetch = () => setKey(key + 1);

    useEffect(() => {
        const load = async () => {
            try {
                const fetchedFiles: FileObject[] = await loadDirectory(serveruuid, '/plugins');
                setFiles(fetchedFiles);

                // Separate directories and .jar files
                const directories = fetchedFiles.filter((file) => file.mimetype === 'inode/directory');
                const jarFiles = fetchedFiles.filter(
                    (file) => file.mimetype === 'application/jar' || file.mimetype === 'application/zip'
                );
                // Extract plugins from file list.
                const plugins: { [id: string]: { name: string; version: string; relatedDirs: string[] } } = {};
                for (const file of jarFiles) {
                    const pluginData = parseFilename(file.name);
                    if (pluginData) {
                        // Find related directories based on plugin name
                        const relatedDirs = directories
                            .map((dir) => {
                                const dice = diceCoefficient(dir.name, pluginData.name);
                                return { name: dir.name, dice };
                            })
                            .filter(({ dice }) => dice > 0.2)
                            .map(({ name }) => name);

                        console.log(`Related dirs for ${pluginData.name}: ${relatedDirs}`);

                        plugins[pluginData.id] = { name: file.name, version: pluginData.version, relatedDirs };
                    }
                }

                setPlugins(plugins);
            } catch (error) {
                console.error('Failed to load directory', error);
            }
        };

        load();
    }, [serveruuid, key]);

    return { files, plugins, refetch };
};

export default useServerPlugins;
