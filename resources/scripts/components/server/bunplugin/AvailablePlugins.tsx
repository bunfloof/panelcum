import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ServerContext } from '@/state/server';
import PluginRow from './PluginRow';
import _ from 'lodash';
import http from '@/api/http';
import InputSpinner from '@/components/elements/InputSpinner';
import Input from '@/components/elements/Input';
import Spinner from '@/components/elements/Spinner';

const AvailablePlugins = () => {
    const observer = useRef<IntersectionObserver | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [sort, setSort] = useState('-downloads');
    const [plugins, setPlugins] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const debouncedSearch = useCallback(
        _.debounce((text: string) => {
            setSearchText(text);
            setPage(1);
        }, 500),
        []
    );

    const lastPluginRef = useCallback(
        (node) => {
            if (loading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1);
                }
            });
            if (node) observer.current.observe(node);
        },
        [loading, hasMore]
    );

    useEffect(() => {
        setLoading(true);
        setPlugins([]);
    }, [searchText, sort]);

    useEffect(() => {
        setLoading(true);
        http.get(`/api/client/plugins/getsearchplugins`, {
            params: {
                resource: searchText,
                size: 20,
                page: page,
                sort: sort,
                fields: 'file,icon.data,name,tag,releaseDate,updateDate,downloads,rating,id,version',
            },
        }).then((res) => {
            const data = res.data.results; // access the results array
            setLoading(false);
            if (data.length === 0) {
                setHasMore(false);
            } else {
                setPlugins((prevPlugins) => [...prevPlugins, ...data]);
            }
        });
    }, [searchText, sort, page]);

    return (
        <>
            <InputSpinner visible={loading}>
                <Input type='text' placeholder='Search plugins...' onChange={(e) => debouncedSearch(e.target.value)} />
            </InputSpinner>
            <div className='flex space-x-4'>
                <span>Sort by:</span>
                <span
                    className={`${sort === '-downloads' ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort('-downloads');
                        setPage(1);
                    }}
                >
                    Downloads
                </span>
                <span
                    className={`${
                        sort === '-rating.average' ? 'text-gray-300 font-medium' : 'underline cursor-pointer'
                    }`}
                    onClick={() => {
                        setSort('-rating.average');
                        setPage(1);
                    }}
                >
                    Rating
                </span>
                <span
                    className={`${sort === '-releaseDate' ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort('-releaseDate');
                        setPage(1);
                    }}
                >
                    Release Date
                </span>
                <span
                    className={`${sort === '-updateDate' ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort('-updateDate');
                        setPage(1);
                    }}
                >
                    Update Date
                </span>
            </div>
            <ul className='bg-gray-700 rounded overflow-hidden'>
                {plugins.map((plugin, index) => {
                    if (plugins.length === index + 1) {
                        return (
                            <li
                                key={plugin.id}
                                className='border-b-2 border-gray-800 last:rounded-b last:border-0 group p-2'
                            >
                                <PluginRow innerRef={lastPluginRef} plugin={plugin} serveruuid={uuid} />
                            </li>
                        );
                    } else {
                        return (
                            <li
                                key={plugin.id}
                                className='border-b-2 border-gray-800 last:rounded-b last:border-0 group p-2'
                            >
                                <PluginRow plugin={plugin} serveruuid={uuid} />
                            </li>
                        );
                    }
                })}
            </ul>
            <div className='flex justify-center items-center | m-20 | m-6'>{loading && <Spinner />}</div>
        </>
    );
};

export default AvailablePlugins;
