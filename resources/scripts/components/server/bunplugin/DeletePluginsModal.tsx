import React, { useState, useContext } from 'react';
import { Formik, Form } from 'formik';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import Input from '@/components/elements/Input';
import deleteFiles from '@/api/server/files/deleteFiles';

const DeletePluginsModal = asDialog({ title: 'Delete Plugin' })(
    (props: { serverUuid: string; pluginFile: string; relatedDirs: string[]; onDeleteSuccess: () => void }) => {
        const { close } = useContext(DialogWrapperContext);
        const { serverUuid, pluginFile, relatedDirs, onDeleteSuccess } = props;

        const [isDeleting, setIsDeleting] = useState(false);

        // initialize all as false
        const initialValues: Record<string, boolean> = relatedDirs.reduce(
            (obj, dir) => ({
                ...obj,
                [dir]: false,
            }),
            {}
        );

        const submit = (values: Record<string, boolean>) => {
            setIsDeleting(true);
            const filesToDelete = relatedDirs.filter((dir) => values[dir]);
            filesToDelete.push(pluginFile); // add the plugin .jar file itself

            deleteFiles(serverUuid, '/plugins', filesToDelete)
                .then(() => {
                    console.log('Success');
                    setIsDeleting(false);
                    close();
                    onDeleteSuccess(); // call the callback function on success
                })
                .catch((error) => {
                    console.error('Error:', error);
                    setIsDeleting(false);
                });
        };

        return (
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
                        {relatedDirs.length === 0 ? (
                            <p>
                                Are you sure you want to delete <strong>{pluginFile}</strong>?
                            </p>
                        ) : (
                            <>
                                <p>
                                    Are you sure you want to delete <strong>{pluginFile}</strong>? This plugin may also
                                    contain associated plugin data. Please select the correct directories to delete
                                    (Optional):
                                </p>
                                {relatedDirs.map((dir) => (
                                    <div css={tw`mt-4 -mb-2 bg-gray-700 p-3 rounded`} key={dir}>
                                        <label htmlFor={dir}>
                                            <div className='flex items-center cursor-pointer'>
                                                <Input
                                                    type={'checkbox'}
                                                    css={tw`text-blue-500! w-5! h-5! mr-2`}
                                                    id={dir}
                                                    checked={values[dir]}
                                                    onChange={() => setFieldValue(dir, !values[dir])}
                                                />
                                                <span>/plugins/{dir}</span>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </>
                        )}

                        <Dialog.Footer>
                            <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                                Cancel
                            </Button.Text>
                            <Button
                                type='submit'
                                css={tw`w-full sm:w-auto`}
                                color='red'
                                onClick={submitForm}
                                disabled={isDeleting}
                            >
                                Delete
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
    pluginFile,
    relatedDirs,
    onDeleteSuccess,
}: {
    className?: string;
    serverUuid: string;
    pluginFile: string;
    relatedDirs: string[];
    onDeleteSuccess: () => void;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <DeletePluginsModal
                open={open}
                onClose={setOpen.bind(null, false)}
                serverUuid={serverUuid}
                pluginFile={pluginFile}
                relatedDirs={relatedDirs}
                onDeleteSuccess={onDeleteSuccess}
            />
            <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                Delete
            </Button.Text>
        </>
    );
};
