import React, { forwardRef, useState } from 'react';
import ModpackExpanded from './ModpackExpanded';

interface Author {
    name: string;
}

interface Logo {
    url: string;
}

interface Modpack {
    name: string;
    authors: Author[];
    summary: string;
    downloadCount: number;
    dateCreated: string;
    dateModified: string;
    links: {
        websiteUrl: string;
    };
    logo: Logo;
    id: string;
}

interface ModpackRowProps {
    modpack: Modpack;
}

const ModpackRow = forwardRef<HTMLDivElement, ModpackRowProps>(({ modpack }, ref) => {
    // Join author names by commas
    const authors = modpack.authors.map((author) => author.name).join(', ');
    const [isExpanded, setIsExpanded] = useState(false);

    // Dates formatting
    const createdDate = new Date(modpack.dateCreated).toLocaleDateString();
    const modifiedDate = new Date(modpack.dateModified).toLocaleDateString();

    return (
        <div className='w-full flex flex-col items-start justify-start' ref={ref}>
            <div className='flex flex-row flex-wrap items-start justify-between'>
                <div className='flex flex-row flex-wrap items-start justify-start'>
                    <div className='flex flex-col items-center justify-start'>
                        <img alt={modpack.name} src={modpack.logo.url} style={{ width: '64px', height: '64px' }} />
                    </div>
                    <div className='flex flex-col items-start justify-start'>
                        <b>
                            {modpack.name} ({modpack.id}) by {authors}
                        </b>
                        <div className='flex flex-col items-start justify-start'>
                            <div>{modpack.summary}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex flex-row flex-wrap items-center justify-end'>
                <div>
                    <span>
                        Downloads: {modpack.downloadCount}, Last Updated: {modifiedDate}, Created: {createdDate}
                    </span>
                </div>
                <div className='flex flex-row flex-wrap items-center justify-end'>
                    <button onClick={() => window.open(modpack.links.websiteUrl, '_blank')}>
                        <div>Info</div>
                    </button>
                    {/* Add more actions as needed */}
                    <button onClick={() => setIsExpanded(!isExpanded)}>
                        <div>More</div>
                    </button>
                </div>
            </div>
            {isExpanded && <ModpackExpanded modId={modpack.id} />}
        </div>
    );
});

export default ModpackRow;
