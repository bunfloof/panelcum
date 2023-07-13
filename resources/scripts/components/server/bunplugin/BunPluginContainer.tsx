import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import PluginRow from './PluginRow';
import _ from 'lodash';
import http from '@/api/http';
import InputSpinner from '@/components/elements/InputSpinner';
import Input from '@/components/elements/Input';

export default () => {
    const observer = useRef<IntersectionObserver | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [sort, setSort] = useState('-downloads');
    const [plugins, setPlugins] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);

    const debouncedSearch = useCallback(
        _.debounce((text) => setSearchText(text), 500),
        []
    ); //test

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
                size: 10,
                page: page,
                sort: sort,
                fields: 'file,icon.data,name,tag,releaseDate,updateDate,downloads,rating,id,version',
            },
        }).then((res) => {
            const data = res.data.results; // access the results array
            console.log(data);
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
            <ServerContentBlock title={'Plugins'}>
                <InputSpinner visible={loading}>
                    <Input
                        type='text'
                        placeholder='Search plugins...'
                        onChange={(e) => debouncedSearch(e.target.value)}
                    />
                </InputSpinner>
                <div>
                    <button
                        onClick={() => {
                            setSort('-downloads');
                            setPage(1);
                        }}
                    >
                        Downloads
                    </button>
                    <button
                        onClick={() => {
                            setSort('-rating.average');
                            setPage(1);
                        }}
                    >
                        Rating
                    </button>
                    <button
                        onClick={() => {
                            setSort('-releaseDate');
                            setPage(1);
                        }}
                    >
                        Release Date
                    </button>
                    <button
                        onClick={() => {
                            setSort('-updateDate');
                            setPage(1);
                        }}
                    >
                        Update Date
                    </button>
                </div>
                {plugins.map((plugin, index) => {
                    if (plugins.length === index + 1) {
                        return <PluginRow innerRef={lastPluginRef} key={plugin.id} plugin={plugin} serveruuid={uuid} />;
                    } else {
                        return <PluginRow key={plugin.id} plugin={plugin} serveruuid={uuid} />;
                    }
                })}

                <div>{loading && 'Loading...'}</div>
            </ServerContentBlock>
        </>
    );
};
