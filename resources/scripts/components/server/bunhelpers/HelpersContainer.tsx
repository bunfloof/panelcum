import React, { useState } from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import HelpersModal from './HelpersModal';

const HelpersContainer = () => {
    const [helpers] = useState([
        {
            name: 'SFTPAndFTPImporter',
            friendlyname: 'SFTP and FTP Importer',
            author: 'bun',
            description: 'Transfer files from other hosts to this host via FTP or SFTP.',
            sourcecode: 'https://github.com/bunfloof/SFTPandFTPImporter',
            directdownloadurl: 'https://github.com/bunfloof/SFTPandFTPImporter/releases/download/Release/main',
            config: {
                dashes: 'double',
                parameters: ['protocol', 'user', 'pass', 'remoteServer', 'remoteFolder', 'targetFolder'],
            },
        },
        // ... Other helper objects
    ]);

    return (
        <ServerContentBlock title={'Helpers'}>
            <ul className='bg-gray-700 rounded overflow-hidden'>
                {helpers.map((helper, index) => (
                    <li className='border-b-2 border-gray-800 last:rounded-b last:border-0 group p-2' key={index}>
                        <div className='w-full flex flex-col items-start justify-start'>
                            <div className='flex flex-row flex-wrap items-start justify-between'>
                                <div className='flex flex-row flex-wrap items-start justify-start'>
                                    <div className='flex flex-col items-center justify-start rounded overflow-hidden'>
                                        <img alt='' src='' style={{ width: '64px', height: '64px' }} />
                                    </div>
                                    <div className='flex flex-col items-start justify-start ml-2'>
                                        <b>{helper.friendlyname}</b>
                                        <div className='flex flex-col items-start justify-start'>
                                            <div>{helper.description}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='self-stretch flex flex-row flex-wrap items-center justify-end'>
                                <div className='flex-1 relative'>
                                    <div className='flex items-center'></div>
                                </div>
                                <div className='flex flex-row flex-wrap items-center justify-end'>
                                    <HelpersModal
                                        helper={helper}
                                        onConfirmed={() => console.log('Helper confirmed!')}
                                    />
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </ServerContentBlock>
    );
};

export default HelpersContainer;
