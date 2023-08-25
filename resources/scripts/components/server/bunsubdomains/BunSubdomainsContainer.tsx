import { Field, Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import http from '@/api/http';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import { Actions, useStoreActions } from 'easy-peasy';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import { httpErrorToHuman } from '@/api/http';
import StyledField from '@/components/elements/Field';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';
import * as Yup from 'yup';
import { ApplicationStore } from '@/state';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

type Subdomain = {
    selectedname: string;
    selectedzone: string;
    selectedip: string;
    selectedport: string;
    selectedrecordtype: string;
    selectedproxystatus: string;
    selectedttl: string;
    // Add any other properties that are relevant
};

interface Allocation {
    object: string;
    attributes: {
        id: number;
        ip: string;
        port: number;
        ip_alias?: string | null;
        notes?: string | null;
        is_default: boolean;
    };
}

interface IpPortOption {
    value: string;
    label: string;
}

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
    const [visibleAddNew, setVisibleAddNew] = useState(false);

    const [isLoadingSubdomains, setIsLoadingSubdomains] = useState(true);

    const [ipPortOptions, setIpPortOptions] = useState<IpPortOption[]>([]);

    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        http.get(`/api/client/servers/${uuid}/subdomains/getallallocations`)
            .then((response) => {
                if (response.data.error) {
                    console.error(response.data.error);
                } else {
                    console.log('Getallallocations:');
                    console.log(response);

                    const options: IpPortOption[] = [];

                    response.data.data.forEach((allocation: Allocation) => {
                        // Always add the main IP
                        options.push({
                            value: JSON.stringify({ ip: allocation.attributes.ip, port: allocation.attributes.port }),
                            label: `${allocation.attributes.ip}:${allocation.attributes.port}`,
                        });

                        // Add the alias IP only if it's not null
                        if (allocation.attributes.ip_alias) {
                            options.push({
                                value: JSON.stringify({
                                    ip: allocation.attributes.ip_alias,
                                    port: allocation.attributes.port,
                                }),
                                label: `${allocation.attributes.ip_alias}:${allocation.attributes.port}`,
                            });
                        }
                    });

                    // Update the state with the new options
                    setIpPortOptions(options);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }, [uuid]);

    const fetchSubdomains = () => {
        http.get(`/api/client/servers/${uuid}/subdomains/getallsubdomains`)
            .then((response) => {
                if (response.data.error) {
                    console.error(response.data.error);
                    setIsLoadingSubdomains(false);
                } else {
                    setSubdomains(response.data);
                    console.log(response.data);
                    setIsLoadingSubdomains(false);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    };

    useEffect(() => {
        fetchSubdomains();
    }, [uuid]);

    const subdomainAddSchema = Yup.object().shape({
        recordtype: Yup.string().required('Required'),
        name: Yup.string().required('Required'),
        content: Yup.string().notOneOf([''], 'Content is required').required('Required'),
    });

    interface DeleteDNSRecordButtonProps {
        selectedname: string;
        selectedzone: string;
    }

    const DeleteDNSRecordButton: React.FC<DeleteDNSRecordButtonProps> = ({ selectedname, selectedzone }) => {
        const [visible, setVisible] = useState(false);
        const [isLoading, setIsLoading] = useState(false);
        const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

        const onDelete = () => {
            setIsLoading(true);
            clearFlashes('server:dns');
            http.post(`/api/client/servers/${uuid}/subdomains/deletesubdomain`, {
                selectedname,
                selectedzone,
            })
                .then(() => {
                    setIsLoading(false);

                    clearFlashes();
                    addFlash({
                        key: 'server:dns',
                        type: 'success',
                        title: 'Success',
                        message: `Record ${selectedname}.${selectedzone} deleted.`,
                    });
                    fetchSubdomains();
                })
                .catch((error) => {
                    console.error(error);
                    clearFlashes();
                    addFlash({
                        key: 'server:dns',
                        type: 'error',
                        title: 'Error',
                        message: httpErrorToHuman(error),
                    });
                    setIsLoading(false);
                    setVisible(false);
                });
        };

        return (
            <>
                <Dialog.Confirm
                    open={visible}
                    onClose={() => setVisible(false)}
                    title={'Delete DNS record'}
                    confirm={'Delete'}
                    onConfirmed={onDelete}
                >
                    <SpinnerOverlay visible={isLoading} />
                    Are you sure you want to delete the DNS record?
                </Dialog.Confirm>
                <Button.Text
                    className={'flex-1 sm:flex-none border-transparent'}
                    onClick={() => setVisible(true)}
                    size={Button.Sizes.Small}
                >
                    Delete
                </Button.Text>
            </>
        );
    };

    const submit = (values: Values) => {
        setIsAdding(true);
        console.log('Submitting form with values:', values);
        // Extract the values needed for the request
        const { name, content } = values;

        // Parse the content value to get the selected IP and port
        const { ip: selectedip, port: selectedport } = JSON.parse(content);

        // Set the other parameters needed for the request
        const selectedname = name; // Assuming this is the correct value
        const selectedzone = 'foxomy.net'; // Assuming this is a fixed value

        // Make the POST request
        http.post(`/api/client/servers/${uuid}/subdomains/createsubdomain`, {
            selectedname,
            selectedzone,
            selectedip,
            selectedport,
        })
            .then((response) => {
                if (response.data.error) {
                    console.log('an error');
                    // Handle the error here
                    console.error(response.data.error);
                    clearFlashes();
                    addFlash({
                        key: 'server:dns',
                        type: 'error',
                        title: 'Error',
                        message: response.data.error,
                    });
                    setIsAdding(false);
                } else {
                    // Handle the success here
                    console.log('a success');
                    console.log(response.data);
                    clearFlashes();
                    addFlash({
                        key: 'server:dns',
                        type: 'success',
                        title: 'Success',
                        message: `Successfully created a record for ${selectedname}.${selectedzone}.`,
                    });
                    setIsAdding(false);
                    fetchSubdomains();
                }
            })
            .catch((error) => {
                // Handle any other errors here
                console.log('a catch');
                console.error(error);
                clearFlashes();
                addFlash({
                    key: 'server:dns',
                    type: 'error',
                    title: 'Error',
                    message: httpErrorToHuman(error),
                });
                setIsAdding(false);
            });
    };

    type Values = {
        recordtype: string;
        name: string;
        subdomain: string;
        content: string;
        proxystatus: string;
        ttl: number | '';
    };

    return (
        <ServerContentBlock title={'Subdomain'}>
            <FlashMessageRender byKey={'server:dns'} />
            <div className='flex justify-end mt-6 mb-3'>
                <Button.Text onClick={() => setVisibleAddNew(!visibleAddNew)}>
                    {visibleAddNew ? 'Cancel' : 'Add record'}
                </Button.Text>
            </div>
            {visibleAddNew && (
                <>
                    <Formik
                        initialValues={{
                            recordtype: 'A',
                            name: '',
                            subdomain: 'foxomy.net',
                            content: ipPortOptions[0]?.value || '',
                            proxystatus: '',
                            ttl: '',
                        }}
                        onSubmit={submit}
                        validationSchema={subdomainAddSchema}
                    >
                        <Form>
                            <div className='lg:flex w-full text-left mb-4'>
                                <div className='w-32'>
                                    <div className='mr-4'>
                                        <Label className='mt-3'>Type</Label>
                                        <Field className='w-2 mt-1' label='Record Type' as={Select} name='recordtype'>
                                            <option value='A'>A (Dedicated)</option>
                                            <option value='SRV'>SRV (Shared)</option>
                                        </Field>
                                    </div>
                                </div>
                                <div className='w-80'>
                                    <div className='mr-4'>
                                        <Label className='mt-3'>Name</Label>
                                        <div className='flex'>
                                            <div className='w-1/2 mr-2'>
                                                <StyledField name='name' placeholder='Name' />
                                            </div>

                                            <div className='w-1/2'>
                                                <Field as={Select} name='subdomain' className='w-full'>
                                                    <option key='foxomy.net' value='foxomy.net'>
                                                        foxomy.net
                                                    </option>
                                                </Field>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='w-80'>
                                    <div className='mr-4'>
                                        <Label className='mt-3'>Content</Label>
                                        <Field as={Select} name='content' className='w-full'>
                                            {ipPortOptions.map((option, index) => (
                                                <option key={index} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Field>
                                    </div>
                                </div>
                                <div className='w-48'>
                                    <div className='mr-4'>
                                        <Label className='mt-3'>proxy</Label>
                                        <Field className='w-2 mt-1' label='Record Types' as={Select} name='proxystatus'>
                                            <option value=''>DNS Only</option>
                                            <option value=''>Bun Proxy</option>
                                        </Field>
                                    </div>
                                </div>
                                <div className='w-24'>
                                    <div className='mr-4'>
                                        <Label className='mt-3'>TTL</Label>
                                        <StyledField
                                            name='ttl'
                                            className='w-full pointer-events-none'
                                            placeholder='14400'
                                        />
                                    </div>
                                </div>
                                <div className='w-36 text-right'>
                                    <div className='mr-4 align-right'>
                                        <Label className='mt-3'>Action</Label>
                                        <Button type={'submit'} css={tw`w-full`} color={'primary'} disabled={isAdding}>
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    </Formik>
                </>
            )}

            <div className='col-span-4 w-full overflow-x-auto'>
                <div className='col-span-4 w-full overflow-x-auto'>
                    {isLoadingSubdomains ? (
                        <Spinner size={'large'} centered />
                    ) : subdomains.length > 0 ? (
                        <>
                            <div className='hidden lg:flex w-full text-left p-2 bg-gray-900 font-medium rounded-t-md'>
                                <div className='w-32'>Type</div>
                                <div className='w-80'>Name</div>
                                <div className='w-80'>Content</div>
                                <div className='w-48'>Port</div>
                                <div className='w-24'>TTL</div>
                                <div className='w-36 text-right pr-4'>Actions</div>
                            </div>
                            {subdomains.map((subdomain, index) => (
                                <div
                                    key={index}
                                    className='flex flex-col lg:flex-row w-full border-b p-2 bg-gray-700 border-gray-800 border-b-2'
                                >
                                    <div className='flex items-center lg:w-32 text-left'>
                                        <span className='lg:hidden font-medium mr-1'>Type: </span>
                                        {subdomain.selectedrecordtype === 'SRV'
                                            ? 'SRV (Shared)'
                                            : subdomain.selectedrecordtype === 'A'
                                            ? 'A (Dedicated)'
                                            : subdomain.selectedrecordtype}
                                    </div>
                                    <div className='flex items-center lg:w-80 text-left'>
                                        <span className='lg:hidden font-medium mr-1'>Name: </span>
                                        {subdomain.selectedname}.{subdomain.selectedzone}
                                    </div>
                                    <div className='flex items-center lg:w-80 text-left'>
                                        <span className='lg:hidden font-medium mr-1'>Content: </span>
                                        {subdomain.selectedip}
                                    </div>
                                    <div className='flex items-center lg:w-48 text-left'>
                                        <span className='lg:hidden font-medium mr-1'>Port: </span>
                                        {subdomain.selectedport}
                                    </div>
                                    <div className='flex items-center lg:w-24 text-left'>
                                        <span className='lg:hidden font-medium mr-1'>TTL: </span>
                                        {subdomain.selectedttl}
                                    </div>
                                    <div className='items-center lg:w-36 text-right pr-4'>
                                        <span className='lg:hidden font-medium mr-1'>Actions: </span>
                                        <DeleteDNSRecordButton
                                            selectedname={subdomain.selectedname}
                                            selectedzone={subdomain.selectedzone}
                                        />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        !visibleAddNew && (
                            <p className='text-center text-sm text-neutral-300'>
                                {`It looks like you don't have any DNS records.`}
                            </p>
                        )
                    )}
                </div>
            </div>
        </ServerContentBlock>
    );
};
