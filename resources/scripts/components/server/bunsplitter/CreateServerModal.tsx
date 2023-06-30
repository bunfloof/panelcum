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
    ram: string;
    disk: string;
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
    [nest_name: string]: { id: number; name: string }[];
};

type CreateServerModalProps = { externalid: string; refreshServerList: () => void; refreshServerDetails: () => void };

const CreateServerModal = asDialog({ title: 'Create Server' })(
    ({ externalid, refreshServerList, refreshServerDetails }: CreateServerModalProps) => {
        const [nests, setNests] = useState<Nests>({});
        const [selectedNest, setSelectedNest] = useState<string | ''>('');
        const { close } = useContext(DialogWrapperContext);

        const [availableRam, setAvailableRam] = useState(0);
        const [availableDisk, setAvailableDisk] = useState(0);

        const [isLoading, setIsLoading] = useState<boolean>(true);

        const ServerCreationSchema = Yup.object().shape({
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

        useEffect(() => {
            console.log('finally', externalid);
            http.get<BirdsData>('/api/client/splitter/bird')
                .then((response) => {
                    //console.log('burd', response.data);
                    const birds = response.data.data;
                    const nests: Nests = birds.reduce((acc, bird) => {
                        const { nest_name, egg_name, egg_id } = bird.attributes; // Adjusted line
                        if (!acc[nest_name]) {
                            acc[nest_name] = [];
                        }
                        acc[nest_name].push({ id: egg_id, name: egg_name });
                        return acc;
                    }, {} as Nests);
                    setNests(nests);
                })
                .catch((error) => {
                    console.error('There has been a problem with your fetch operation:', error);
                });
        }, []);

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

        const { clearFlashes, addError } = useFlash();
        const [isCreating, setIsCreating] = useState(false);
        const submit = (values: Values) => {
            values.external_id = externalid;
            setIsCreating(true);
            http.post(`/api/client/splitter/createserver`, values)
                .then((response) => {
                    if (response.data.status === 'error') {
                        clearFlashes();
                        addError({ key: 'server:create', message: response.data.message });
                        setIsCreating(false);
                    } else {
                        console.log('Received data from createserver:', response.data);
                        clearFlashes('server:create');
                        close(); // Close the modal after a successful response.
                        refreshServerList();
                        refreshServerDetails();
                        setIsCreating(false);
                    }
                })
                .catch((error) => {
                    console.error('There has been a problem with your fetch operation:', error);
                    addError({ key: `server:create-${Date.now()}`, message: 'Unexpected error, please try again.' });
                });
        };

        return isLoading ? (
            <p>Loading...</p> // Return null while loading
        ) : (
            <Formik
                initialValues={{ nest: '', egg: '', name: '', ram: '', disk: '', external_id: '' }}
                onSubmit={submit}
                validationSchema={ServerCreationSchema}
            >
                {({ setFieldValue, values, submitForm }) => (
                    <>
                        <FlashMessageRender byKey={'server:create'} css={tw`mb-4`} />
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
                            <StyledField name='ram' css={tw`w-full`} placeholder='Memory (MiB)' />
                            <Label css={tw`mt-3`}>Disk (MiB)</Label>
                            <StyledField name='disk' css={tw`w-full`} placeholder='Disk (MiB)' />
                            <Label css={tw`mt-3`}>Nest (Category)</Label>
                            <Field
                                css={tw`w-full mt-1`}
                                label='nest'
                                as={Select}
                                name='nest'
                                value={values.nest} // Reflect current selected value
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                    const selectedName = Object.entries(nests).find(
                                        ([_, value]) => value[0].id.toString() === e.target.value
                                    )?.[0];
                                    setSelectedNest(selectedName || '');
                                    setFieldValue('nest', Number(e.target.value));
                                }}
                            >
                                <option value=''>Select Nest</option>
                                {Object.entries(nests).map(([name, value]) => (
                                    <option key={value[0].id} value={value[0].id}>
                                        {name}
                                    </option>
                                ))}
                            </Field>

                            {selectedNest && (
                                <>
                                    <Label css={tw`mt-3`}>Egg</Label>
                                    <Field
                                        css={tw`w-full mt-3`}
                                        label='egg'
                                        as={Select}
                                        name='egg'
                                        value={values.egg} // Reflect current selected value
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                            setFieldValue('egg', Number(e.target.value));
                                        }}
                                    >
                                        <option value=''>Select Egg (Type)</option>
                                        {nests[selectedNest].map((egg) => (
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
                                    disabled={isCreating}
                                >
                                    Create Server
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
    externalid,
    refreshServerList,
    refreshServerDetails,
}: WithClassname & CreateServerModalProps) => {
    const [open, setOpen] = useState(false);
    const { clearFlashes } = useFlash(); // Make sure this is available
    useEffect(() => {
        if (open) {
            clearFlashes('server:create');
        }
    }, [open]);

    return (
        <>
            <CreateServerModal
                open={open}
                onClose={setOpen.bind(this, false)}
                externalid={externalid}
                refreshServerList={refreshServerList}
                refreshServerDetails={refreshServerDetails}
            />
            <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                Create Server
            </Button.Text>
        </>
    );
};
