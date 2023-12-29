import React, { useContext, useState } from 'react';
import { Formik, Form } from 'formik';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import StyledField from '@/components/elements/Field';
import { Dialog, DialogWrapperContext } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import { WithClassname } from '@/components/types';

type Helper = {
    name: string;
    friendlyname: string;
    description: string;
    sourcecode: string;
    directdownloadurl: string;
    config: {
        dashes: string;
        parameters: string[];
    };
};

type Values = {
    confirm?: string;
    parameters?: { [key: string]: string };
};

const HelperDetailsModal = asDialog({ title: 'Helper Details' })(
    (props: { helper: Helper; onConfirmed: () => void }) => {
        const { close } = useContext(DialogWrapperContext);
        const { helper } = props;

        const initialValues: Values = {
            confirm: helper.name,
            parameters: helper.config.parameters.reduce((acc, param) => {
                acc[param] = ''; // Initialize each parameter with an empty string
                return acc;
            }, {} as { [key: string]: string }),
        };

        return (
            <Formik
                initialValues={initialValues}
                onSubmit={(values, actions) => {
                    console.log('Form submitted', values);
                    props.onConfirmed();
                    close();
                    actions.setSubmitting(false);
                }}
            >
                {({ submitForm }) => (
                    <Form>
                        <strong>{helper.friendlyname}</strong>
                        <p>{helper.description}</p>
                        {/* Map over parameters and generate StyledField for each */}
                        {helper.config.parameters.map((param) => (
                            <StyledField
                                key={param}
                                type='text'
                                name={`parameters.${param}`}
                                css={tw`w-full mt-6`}
                                placeholder={param}
                            />
                        ))}
                        <StyledField
                            type='text'
                            name='confirm'
                            css={tw`w-full mt-6`}
                            placeholder={`Please type "${helper.name}" to confirm.`}
                        />
                        <Dialog.Footer>
                            <Button.Text className={'w-full sm:w-auto'} onClick={close}>
                                Cancel
                            </Button.Text>
                            <Button type='submit' css={tw`w-full sm:w-auto`} onClick={submitForm}>
                                Confirm
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
    helper,
    onConfirmed,
}: WithClassname & {
    helper: Helper;
    onConfirmed: () => void;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <HelperDetailsModal
                open={open}
                onClose={setOpen.bind(null, false)}
                helper={helper}
                onConfirmed={onConfirmed}
            />
            <Button.Text onClick={setOpen.bind(this, true)} className={className}>
                View Details
            </Button.Text>
        </>
    );
};
