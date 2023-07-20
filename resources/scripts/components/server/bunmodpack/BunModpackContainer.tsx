import React, { useRef, useState, useEffect, useCallback } from 'react';
import _ from 'lodash';
import http from '@/api/http';
import ModpackRow from './ModpackRow';
import InputSpinner from '@/components/elements/InputSpinner';
import Input from '@/components/elements/Input';
import Spinner from '@/components/elements/Spinner';
import ServerContentBlock from '@/components/elements/ServerContentBlock';

const BunModpackContainer: React.FC = () => {
    const observer = useRef<IntersectionObserver | null>(null);
    const [page, setPage] = useState(0); // start from 0
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [sort, setSort] = useState(6);
    const [mods, setMods] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');

    const debouncedSearch = useCallback(
        _.debounce((text: string) => {
            setPage(0); // reset page to 0
            setSearchText(text);
        }, 500),
        []
    );

    const lastModRef = useCallback(
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
        setMods([]);
        setHasMore(true); // reset the hasMore flag
    }, [searchText, sort]);

    useEffect(() => {
        setLoading(true);
        http.get(`/api/client/modpacks/getmodssearch`, {
            params: {
                gameId: 432,
                classId: 4471,
                sortOrder: 'desc',
                sortField: sort,
                index: page * 20, // calculate the starting index based on the page number
                pageSize: 20,
                searchFilter: searchText,
            },
        }).then((res) => {
            const data = res.data.results.data;
            setLoading(false);
            if (data.length === 0) {
                setHasMore(false);
            } else {
                setMods((prevMods) => [...prevMods, ...data]);
            }
        });
    }, [searchText, sort, page]);

    return (
        <ServerContentBlock title={'Modpacks'}>
            <InputSpinner visible={loading}>
                <Input type='text' placeholder='Search mods...' onChange={(e) => debouncedSearch(e.target.value)} />
            </InputSpinner>
            <div className='flex space-x-4'>
                <span>Sort by:</span>
                <span
                    className={`${sort === 2 ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort(2);
                        setPage(0); // reset page to 0
                    }}
                >
                    Popularity
                </span>
                <span
                    className={`${sort === 6 ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort(6);
                        setPage(0); // reset page to 0
                    }}
                >
                    Total Downloads
                </span>
                <span
                    className={`${sort === 3 ? 'text-gray-300 font-medium' : 'underline cursor-pointer'}`}
                    onClick={() => {
                        setSort(3);
                        setPage(0); // reset page to 0
                    }}
                >
                    Last Updated
                </span>
            </div>
            {mods.map((modpack, index) => {
                if (mods.length === index + 1) {
                    return <ModpackRow ref={lastModRef} key={`${modpack.id}-${index}`} modpack={modpack} />;
                } else {
                    return <ModpackRow key={`${modpack.id}-${index}`} modpack={modpack} />;
                }
            })}

            <div className='flex justify-center items-center | m-20 | m-6'>{loading && <Spinner />}</div>
        </ServerContentBlock>
    );
};

export default BunModpackContainer;
