import React, { useContext, useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { WithClassname } from '@/components/types';
import Input from '@/components/elements/Input';
import getServerSubusers from '@/api/server/users/getServerSubusers';
import { ServerContext } from '@/state/server';
import createOrUpdateSubuser from '@/api/server/users/createOrUpdateSubuser';
import { Subuser } from '@/state/server/subusers';

const SyncSubusersModal = asDialog({ title: 'Sync Subusers' })((props: { serverName: string; serverUuid: string }) => {
    const { close } = useContext(DialogWrapperContext);
    const { serverName, serverUuid } = props;

    const primaryUuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const primaryServerName = ServerContext.useStoreState((state) => state.server.data!.name);

    const [isSyncing, setIsSyncing] = useState(false);
    const [subusers, setSubusers] = useState<Subuser[]>([]);
    const [initialValues, setInitialValues] = useState<{ [key: string]: boolean }>({});

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true; // Add this line

        console.log('getting subusers', primaryUuid);
        getServerSubusers(primaryUuid)
            .then((primarySubusers) => {
                if (isMounted) {
                    // Add this line
                    console.log('subusers', primarySubusers);
                    setSubusers(primarySubusers);

                    // Initialize all as false
                    const tempInitialValues = primarySubusers.reduce(
                        (obj, subuser) => ({
                            ...obj,
                            [subuser.uuid]: false,
                        }),
                        {}
                    );

                    // fetch subusers from the target server
                    getServerSubusers(serverUuid)
                        .then((targetSubusers) => {
                            const targetSubuserUuids = targetSubusers.map((subuser) => subuser.uuid);

                            // Only set to true if exists in targetSubuserUuids
                            setInitialValues(
                                primarySubusers.reduce(
                                    (obj, subuser) => ({
                                        ...obj,
                                        [subuser.uuid]: targetSubuserUuids.includes(subuser.uuid),
                                    }),
                                    tempInitialValues
                                )
                            );

                            setLoading(false); // We are done with loading
                        })
                        .catch((error) => console.error(error));
                }
            })
            .catch((error) => {
                console.error(error);
            });

        return () => {
            isMounted = false; // Add this line
        };
    }, []);

    const submit = (values: { [key: string]: boolean }) => {
        setIsSyncing(true);
        Promise.all(
            subusers
                .filter((subuser) => values[subuser.uuid])
                .map((subuser) => {
                    const params = { email: subuser.email, permissions: subuser.permissions };
                    console.log(serverUuid, params);
                    return createOrUpdateSubuser(serverUuid, params); // Added 'return' here
                })
        )
            .then(() => {
                console.log('Success');
                setIsSyncing(false);
                close();
            })
            .catch((error) => {
                console.error('Error:', error);
                setIsSyncing(false);
            });
    };

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <Formik
                    initialValues={initialValues}
                    onSubmit={(values, actions) => {
                        console.log('Form submitted', values);
                        submit(values);
                        actions.setSubmitting(false);
                    }}
                >
                    {({ submitForm, setFieldValue, values }) => (
                        <Form>
                            <p>
                                Select subusers to sync permissions from {primaryServerName} to{' '}
                                <strong>{serverName}</strong>.
                            </p>
                            {subusers.map((subuser) => (
                                <div css={tw`mt-4 -mb-2 bg-gray-700 p-3 rounded`} key={subuser.uuid}>
                                    <label htmlFor={subuser.uuid}>
                                        <div className='flex items-center cursor-pointer'>
                                            <Input
                                                type={'checkbox'}
                                                css={tw`text-blue-500! w-5! h-5! mr-2`}
                                                id={subuser.uuid}
                                                checked={values[subuser.uuid]}
                                                onChange={() => setFieldValue(subuser.uuid, !values[subuser.uuid])}
                                            />
                                            <span>{subuser.username}</span>
                                        </div>
                                    </label>
                                </div>
                            ))}

                            <Dialog.Footer>
                                <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                                    Cancel
                                </Button.Text>
                                <Button
                                    type='submit'
                                    css={tw`w-full sm:w-auto`}
                                    color='red'
                                    onClick={submitForm}
                                    disabled={isSyncing} // Replace isSubmitting with isDeleting
                                >
                                    Sync
                                </Button>
                            </Dialog.Footer>
                        </Form>
                    )}
                </Formik>
            )}
        </div>
    );
});

export default ({
    className,
    serverUuid,
    serverName,
}: WithClassname & {
    serverUuid: string;
    serverName: string;
}) => {
    const [open, setOpen] = useState(false);

    // Fetch the primaryServerName
    const primaryServerName = ServerContext.useStoreState((state) => state.server.data!.name);

    // If primaryServerName equals serverName, return null
    if (primaryServerName === serverName) {
        return null;
    }

    return (
        <>
            <SyncSubusersModal
                open={open}
                onClose={setOpen.bind(null, false)}
                serverName={serverName}
                serverUuid={serverUuid}
            />
            <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                Sync
            </Button.Text>
        </>
    );
};
