import React, { useState, useContext } from 'react';
import tw from 'twin.macro';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { Button } from '@/components/elements/button/index';
import { Formik, Form } from 'formik';
import http from '@/api/http';
import Input from '@/components/elements/Input'; // Imported Input
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory'; // Imported loadDirectory
import deleteFiles from '@/api/server/files/deleteFiles'; // Imported deleteFiles

interface FormValues {
    deleteFiles: boolean;
}

const InstallModpackModal = asDialog({ title: 'Install Modpack' })(
    (props: {
        serverUuid: string;
        modId: number;
        modName: string;
        serverPackFileId: number | undefined;
        onInstallSuccess: () => void;
    }) => {
        const { close } = useContext(DialogWrapperContext);
        const { serverUuid, modId, modName, serverPackFileId, onInstallSuccess } = props;

        const [isInstalling, setIsInstalling] = useState(false);
        const [isDeleting, setIsDeleting] = useState(false);

        const submit = async (values: FormValues) => {
            setIsInstalling(true);

            // If checkbox is checked, delete all files and directories
            if (values.deleteFiles) {
                setIsDeleting(true);
                const allFiles: FileObject[] = await loadDirectory(serverUuid);

                deleteFiles(
                    serverUuid,
                    '/',
                    allFiles.map((file) => file.name)
                )
                    .then(() => {
                        console.log('Entered deletion .then block');
                        setIsDeleting(false);
                        // Do the installation here after deletion is done
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
                    })
                    .catch((error) => {
                        console.error('Deletion error:', error);
                        setIsDeleting(false);
                    });
            } else {
                // If checkbox is not checked, just run the installation
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
            }
        };

        return (
            <Formik<FormValues>
                initialValues={{ deleteFiles: false }}
                onSubmit={(values, actions) => {
                    console.log('Form submitted', values);
                    submit(values);
                    actions.setSubmitting(false);
                }}
            >
                {({ submitForm }) => (
                    <Form>
                        <p>
                            Are you sure you want to run the installation script for the modpack{' '}
                            <strong>{modName}</strong>? Please delete all files and directories in your server before
                            installing for a clean install (Optional):
                        </p>
                        <div css={tw`mt-4 -mb-2 bg-gray-700 p-3 rounded`}>
                            <label>
                                <div className='flex items-center cursor-pointer'>
                                    <Input
                                        css={tw`text-blue-500! w-5! h-5! mr-2`}
                                        type={'checkbox'}
                                        name={'deleteFiles'}
                                    />
                                    <span> Delete all files and directories</span>
                                </div>
                            </label>
                        </div>
                        <Dialog.Footer>
                            <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                                Cancel
                            </Button.Text>
                            <Button
                                type='submit'
                                css={tw`w-full sm:w-auto`}
                                color='green'
                                onClick={submitForm}
                                disabled={isInstalling || isDeleting}
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
    modName,
    serverPackFileId,
    onInstallSuccess,
}: {
    className?: string;
    serverUuid: string;
    modId: number;
    modName: string;
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
                modName={modName}
                serverPackFileId={serverPackFileId}
                onInstallSuccess={onInstallSuccess}
            />
            <Button.Text onClick={setOpen.bind(this, true)} size={Button.Sizes.Small} className={`${className}`}>
                Install
            </Button.Text>
        </>
    );
};
