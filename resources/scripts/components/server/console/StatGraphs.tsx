import React, { useContext, useEffect, useRef } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { Line } from 'react-chartjs-2';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { hexToRgba } from '@/lib/helpers';
import { bytesToString } from '@/lib/formatters';
import { CloudDownloadIcon, CloudUploadIcon } from '@heroicons/react/solid';
import { theme as twTheme } from 'twin.macro';
import ChartBlock from '@/components/server/console/ChartBlock';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import { ThemeContext } from '@/components/App'; // Adjust the path to where App.tsx is located

export default () => {
    const { theme } = useContext(ThemeContext);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

    const cpu = useChartTickLabel('CPU', limits.cpu, '%', 2, theme);
    const memory = useChartTickLabel('Memory', limits.memory, 'MiB', undefined, theme);
    const network = useChart(
        'Network',
        {
            sets: 2,
            options: {
                scales: {
                    y: {
                        ticks: {
                            callback(value) {
                                return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                            },
                        },
                    },
                },
            },
            callback(opts, index) {
                return {
                    ...opts,
                    label: !index ? 'Network In' : 'Network Out',
                    borderColor: !index ? twTheme('colors.cyan.400') : twTheme('colors.yellow.400'),
                    backgroundColor: hexToRgba(!index ? twTheme('colors.cyan.700') : twTheme('colors.yellow.700'), 0.5),
                };
            },
        },
        theme
    );

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
        }
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: any = {};
        try {
            values = JSON.parse(data);
        } catch (e) {
            return;
        }
        cpu.push(values.cpu_absolute);
        memory.push(Math.floor(values.memory_bytes / 1024 / 1024));
        network.push([
            previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx),
            previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx),
        ]);

        previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes };
    });

    return (
        <>
            <ChartBlock title={'CPU Load'}>
                <Line {...cpu.props} />
            </ChartBlock>
            <ChartBlock title={'Memory'}>
                <Line {...memory.props} />
            </ChartBlock>
            <ChartBlock
                title={'Network'}
                legend={
                    <>
                        <Tooltip arrow content={'Inbound'}>
                            <CloudDownloadIcon className={'mr-2 w-4 h-4 text-yellow-400'} />
                        </Tooltip>
                        <Tooltip arrow content={'Outbound'}>
                            <CloudUploadIcon className={'w-4 h-4 text-cyan-400'} />
                        </Tooltip>
                    </>
                }
            >
                <Line {...network.props} />
            </ChartBlock>
        </>
    );
};
