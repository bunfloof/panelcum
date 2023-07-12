import React, { forwardRef, FunctionComponent, Ref } from 'react';

type PluginProps = {
    plugin: any;
    innerRef?: Ref<HTMLDivElement>;
};

const PluginRow: FunctionComponent<PluginProps> = ({ plugin, innerRef }) => {
    return (
        <div className='w-full flex flex-col items-start justify-start' ref={innerRef}>
            <div className='flex flex-row flex-wrap items-start justify-between'>
                <div className='flex flex-row flex-wrap items-start justify-start'>
                    <div className='flex flex-col items-center justify-start'>
                        <img alt='' src={plugin.icon.url} />
                    </div>
                    <div className='flex flex-col items-start justify-start'>
                        <b>{plugin.name}</b>
                        <div className='flex flex-col items-start justify-start'>
                            <div>{plugin.tag}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='flex flex-row flex-wrap items-center justify-end'>
                <div>
                    <span>{`Downloads: `}</span>
                    <span>{`${plugin.downloads}, Last Updated: ${new Date(
                        plugin.updateDate * 1000
                    ).toLocaleString()}, Created: ${new Date(
                        plugin.releaseDate * 1000
                    ).toLocaleString()}, Rating: ${plugin.rating.average.toFixed(1)}/5 from ${
                        plugin.rating.count
                    } reviews`}</span>
                </div>
            </div>
        </div>
    );
};

export default PluginRow;