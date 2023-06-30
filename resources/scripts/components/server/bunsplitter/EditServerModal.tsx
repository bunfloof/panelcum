import React, { useContext, useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import Select from '@/components/elements/Select';
import StyledField from '@/components/elements/Field';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { WithClassname } from '@/components/types';
import http from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import * as Yup from 'yup';
import Label from '@/components/elements/Label';

type Values = {
    nest: number | '';
    egg: number | '';
    name: string;
    ram: number;
    disk: number;
    external_id: string;
};

interface BirdAttributes {
    nest_name: string;
    nest_id: number;
    egg_name: string;
    egg_id: number;
}

interface Bird {
    object: string;
    attributes: BirdAttributes;
}

interface BirdsData {
    object: string;
    data: Bird[];
}

type Nests = {
    [nest_name: string]: { id: number; name: string; eggs: { id: number; name: string }[] };
};

type EditServerModalProps = {
    serverName: string;
    serverMemory: number;
    serverDisk: number;
    serverNestId: number;
    serverEggId: number;
    externalid: string;
    serverUuid: string;
    refreshServerList: () => void;
    refreshServerDetails: () => void;
};

const EditServerModal = asDialog({ title: 'Edit Server' })(
    ({
        serverName,
        serverMemory,
        serverDisk,
        serverNestId,
        serverEggId,
        serverUuid,
        externalid,
        refreshServerList,
        refreshServerDetails,
    }: EditServerModalProps) => {
        const [nests, setNests] = useState<Nests>({});
        const [selectedNest, setSelectedNest] = useState<string | ''>('');
        const [isLoading, setIsLoading] = useState<boolean>(true);
        const { close } = useContext(DialogWrapperContext);
        const { addError, clearFlashes } = useFlash();

        const [availableRam, setAvailableRam] = useState(0);
        const [availableDisk, setAvailableDisk] = useState(0);

        const ServerEditSchema = Yup.object().shape({
            name: Yup.string().required('A server name is required.'),
            ram: Yup.number()
                .transform((value, originalValue) => {
                    const number = parseFloat(originalValue);
                    return isNaN(number) ? undefined : number;
                })
                .required('Memory (MiB) is required.')
                .min(1, 'Memory (MiB) must be greater than 0.'),
            disk: Yup.number()
                .transform((value, originalValue) => {
                    const number = parseFloat(originalValue);
                    return isNaN(number) ? undefined : number;
                })
                .required('Disk (MiB) is required.')
                .min(1, 'Disk (MiB) must be greater than 0.'),
        });

        const EXCLUDED_NESTS = ['Unlisted'];

        useEffect(() => {
            http.get<BirdsData>('/api/client/splitter/bird/')
                .then((response) => {
                    const birds = response.data.data;
                    const nests: Nests = birds.reduce((acc, bird) => {
                        const { nest_name, nest_id, egg_name, egg_id } = bird.attributes;

                        // Skip if nest_name is in the exclusion list
                        if (EXCLUDED_NESTS.includes(nest_name)) {
                            return acc;
                        }

                        if (!acc[nest_name]) {
                            acc[nest_name] = { id: nest_id, name: nest_name, eggs: [] };
                        }
                        acc[nest_name].eggs.push({ id: egg_id, name: egg_name });
                        return acc;
                    }, {} as Nests);
                    setNests(nests);
                    const defaultNestName = Object.keys(nests).find((name) =>
                        nests[name].eggs.some((egg) => egg.id === serverEggId)
                    );
                    setSelectedNest(defaultNestName || '');
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error('There has been a problem with your fetch operation:', error);
                });
        }, []);

        const [isEditing, setIsEditing] = useState(false);

        useEffect(() => {
            http.get(`/api/client/splitter/getramanddiskinfo/${externalid}`)
                .then((response) => {
                    console.log('Received data from getramanddiskinfo:', response.data);
                    setAvailableRam(response.data.availableRam);
                    setAvailableDisk(response.data.availableDisk);
                    setIsLoading(false);
                })
                .catch((error) => {
                    console.error('There has been a problem with your fetch operation:', error);
                    setIsLoading(false);
                });
        }, [externalid]);

        const submit = (values: Values) => {
            clearFlashes('server:edit');
            console.log('coems', values);
            values.external_id = externalid;
            setIsEditing(true);
            http.post(`/api/client/splitter/editserver/${serverUuid}`, values)
                .then((response) => {
                    console.log('Received data from editserver:', response.data);
                    if (response.data.status === 'error') {
                        addError({ key: 'server:edit', message: response.data.message });
                        setIsEditing(false);
                    } else {
                        console.log('Received data from editserver:', response.data);
                        close(); // Close the modal after a successful response.
                        refreshServerList();
                        refreshServerDetails();
                        setIsEditing(false);
                    }
                })
                .catch((error) => {
                    console.error('There has been a problem with your fetch operation:', error);
                    addError({ key: 'server:edit', message: 'Unexpected error, please try again.' });
                });
        };
        return isLoading ? (
            <p>Loading...</p> // Return null while loading
        ) : (
            <Formik
                initialValues={{
                    nest: serverNestId,
                    egg: serverEggId,
                    name: serverName,
                    ram: serverMemory,
                    disk: serverDisk,
                    external_id: externalid,
                }}
                validationSchema={ServerEditSchema}
                onSubmit={submit}
            >
                {({ setFieldValue, values, submitForm }) => (
                    <>
                        <FlashMessageRender byKey={'server:edit'} css={tw`mb-6`} />
                        <Form>
                            <p>
                                You may allocate <strong>{availableRam}</strong> MiB of memory and{' '}
                                <strong>{availableDisk}</strong> MiB of disk space.
                            </p>
                            {(availableRam === 0 || availableDisk === 0) && (
                                <p>Please edit an existing server to free resources first.</p>
                            )}
                            <Label css={tw`mt-3`}>Name</Label>
                            <StyledField name='name' css={tw`w-full`} placeholder='Server Name' />
                            <Label css={tw`mt-3`}>Memory (MiB)</Label>
                            <StyledField name='ram' css={tw`w-full`} placeholder='RAM' />
                            <Label css={tw`mt-3`}>Disk (MiB)</Label>
                            <StyledField name='disk' css={tw`w-full`} placeholder='DISK' />
                            <Label css={tw`mt-3`}>Nest (Category)</Label>
                            <Field
                                as={Select}
                                name='nest'
                                value={values.nest}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    const selectedId = Number(e.target.value);
                                    const selectedName = Object.keys(nests).find(
                                        (nestName) => nests[nestName].id === selectedId
                                    );
                                    setSelectedNest(selectedName || '');
                                    setFieldValue('nest', selectedId);
                                }}
                            >
                                <option value=''>Select Nest</option>
                                {Object.keys(nests).map((nestName) => (
                                    <option key={nests[nestName].id} value={nests[nestName].id}>
                                        {nestName}
                                    </option>
                                ))}
                            </Field>
                            {selectedNest && (
                                <>
                                    <Label css={tw`mt-3`}>Egg (Type)</Label>
                                    <Field
                                        as={Select}
                                        name='egg'
                                        value={values.egg}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                            setFieldValue('egg', Number(e.target.value));
                                        }}
                                    >
                                        <option value=''>Select Egg</option>
                                        {nests[selectedNest].eggs.map((egg) => (
                                            <option key={egg.id} value={egg.id}>
                                                {egg.name}
                                            </option>
                                        ))}
                                    </Field>
                                </>
                            )}
                            <Dialog.Footer>
                                <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                                    Cancel
                                </Button.Text>
                                <Button
                                    type={'submit'}
                                    css={tw`w-full sm:w-auto`}
                                    color={'primary'}
                                    onClick={submitForm}
                                    disabled={isEditing}
                                >
                                    Save Changes
                                </Button>
                            </Dialog.Footer>
                        </Form>
                    </>
                )}
            </Formik>
        );
    }
);

export default ({
    className,
    serverName,
    serverMemory,
    serverDisk,
    serverNestId,
    serverEggId,
    serverUuid,
    externalid,
    refreshServerList,
    refreshServerDetails,
}: WithClassname & EditServerModalProps) => {
    const [open, setOpen] = useState(false);
    const { clearFlashes } = useFlash(); // Make sure this is available

    useEffect(() => {
        if (open) {
            clearFlashes('server:edit');
        }
    }, [open]);

    return (
        <>
            <EditServerModal
                open={open}
                onClose={setOpen.bind(this, false)}
                externalid={externalid}
                serverUuid={serverUuid}
                serverName={serverName}
                serverMemory={serverMemory}
                serverDisk={serverDisk}
                serverNestId={serverNestId}
                serverEggId={serverEggId}
                refreshServerList={refreshServerList}
                refreshServerDetails={refreshServerDetails}
            />
            <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                Edit Server
            </Button.Text>
        </>
    );
};
