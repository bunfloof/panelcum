import React, { useContext, useState, useCallback } from 'react';
import { Formik, Form } from 'formik';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import StyledField from '@/components/elements/Field';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { WithClassname } from '@/components/types';
import http from '@/api/http';
import * as Yup from 'yup';

type Values = {
    confirm: string;
};

const DeleteServerModal = asDialog({ title: 'Delete Server' })(
    (props: {
        serverName: string;
        serverUuid: string;
        refreshServerList: () => void;
        refreshServerDetails: () => void;
    }) => {
        const { close } = useContext(DialogWrapperContext);
        const { serverName, serverUuid } = props;

        const refreshServerList = useCallback(props.refreshServerList, []);
        const refreshServerDetails = useCallback(props.refreshServerDetails, []);

        const initialValues: Values = { confirm: '' };

        const DeleteServerSchema = Yup.object().shape({
            confirm: Yup.string()
                .required('The server name must be provided.')
                .oneOf([serverName], 'The entered server name does not match.'),
        });
        const [isDeleting, setIsDeleting] = useState(false); // Add this line

        const submit = (values: Values) => {
            console.log('Attempting to delete server with values:', values);
            setIsDeleting(true); // Set isDeleting to true when delete operation starts
            http.get(`/api/client/splitter/deleteserver/${serverUuid}`)
                .then((response) => {
                    console.log('Successfully deleted server', response.data);
                    close();
                    refreshServerList();
                    refreshServerDetails();
                    setIsDeleting(false); // Set isDeleting to false when delete operation ends
                })
                .catch((error) => {
                    console.error('There has been a problem with your delete operation:', error);
                    setIsDeleting(false); // Set isDeleting to false if there is an error
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
                validationSchema={DeleteServerSchema}
            >
                {({ submitForm }) => (
                    <Form>
                        This is a permanent operation. This will permanently delete <strong>{serverName}</strong> and
                        remove all associated data.
                        <StyledField
                            type='text'
                            name='confirm'
                            css={tw`w-full mt-6`}
                            placeholder={`Please type "${serverName}" to confirm.`}
                        />
                        <Dialog.Footer>
                            <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                                Cancel
                            </Button.Text>
                            <Button.Danger
                                type='submit'
                                css={tw`w-full sm:w-auto`}
                                color='red'
                                onClick={submitForm}
                                disabled={isDeleting} // Replace isSubmitting with isDeleting
                            >
                                Confirm Deletion
                            </Button.Danger>
                        </Dialog.Footer>
                    </Form>
                )}
            </Formik>
        );
    }
);

export default ({
    className,
    serverName,
    serverUuid,
    refreshServerList,
    refreshServerDetails,
}: WithClassname & {
    serverName: string;
    serverUuid: string;
    refreshServerList: () => void;
    refreshServerDetails: () => void;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <DeleteServerModal
                open={open}
                onClose={setOpen.bind(null, false)} // Note: me when I permanently stain ur fursuit with my cum
                serverName={serverName}
                serverUuid={serverUuid}
                refreshServerList={refreshServerList}
                refreshServerDetails={refreshServerDetails}
            />
            <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                Delete Server
            </Button.Text>
        </>
    );
};
