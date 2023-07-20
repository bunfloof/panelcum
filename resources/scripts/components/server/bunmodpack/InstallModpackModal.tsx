import React, { useState, useContext } from 'react';
import tw from 'twin.macro';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { Button } from '@/components/elements/button/index';
import { Formik, Form } from 'formik';
import http from '@/api/http';

const InstallModpackModal = asDialog({ title: 'Install Modpack' })(
    (props: {
        serverUuid: string;
        modId: number;
        serverPackFileId: number | undefined;
        onInstallSuccess: () => void;
    }) => {
        const { close } = useContext(DialogWrapperContext);
        const { serverUuid, modId, serverPackFileId, onInstallSuccess } = props;

        const [isInstalling, setIsInstalling] = useState(false);

        const submit = () => {
            setIsInstalling(true);

            http.post(`/api/client/modpacks/editserver/${serverUuid}/${modId}/${serverPackFileId}`)
                .then((response) => {
                    console.log('Success:', response.data);
                    if (response.data.status === 'error') {
                        console.error('Error:', response.data.message);
                    } else {
                        setIsInstalling(false);
                        close();
                        onInstallSuccess(); // call the callback function on success
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                    setIsInstalling(false);
                });
        };

        return (
            <Formik
                initialValues={{}}
                onSubmit={(values, actions) => {
                    console.log('Form submitted', values);
                    submit();
                    actions.setSubmitting(false);
                }}
            >
                {({ submitForm }) => (
                    <Form>
                        <p>
                            Are you sure you want to install modpack <strong>{modId}</strong>?
                        </p>
                        <Dialog.Footer>
                            <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                                Cancel
                            </Button.Text>
                            <Button
                                type='submit'
                                css={tw`w-full sm:w-auto`}
                                color='green'
                                onClick={submitForm}
                                disabled={isInstalling}
                            >
                                Install
                            </Button>
                        </Dialog.Footer>
                    </Form>
                )}
            </Formik>
        );
    }
);

export default ({
    className,
    serverUuid,
    modId,
    serverPackFileId,
    onInstallSuccess,
}: {
    className?: string;
    serverUuid: string;
    modId: number;
    serverPackFileId: number | undefined;
    onInstallSuccess: () => void;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <InstallModpackModal
                open={open}
                onClose={setOpen.bind(null, false)}
                serverUuid={serverUuid}
                modId={modId}
                serverPackFileId={serverPackFileId}
                onInstallSuccess={onInstallSuccess}
            />
            <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                Install
            </Button.Text>
        </>
    );
};
