import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';
import asDialog from '@/hoc/asDialog';
import http from '@/api/http';
import * as Yup from 'yup';
import { ServerContext } from '@/state/server';
import JimpType from 'jimp';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Jimp: typeof JimpType = require('jimp/es');

import saveFileContents from '@/api/server/files/saveFileContents';
import loadDirectory from '@/api/server/files/loadDirectory';
import getFileContents from '@/api/server/files/getFileContents';

const UploadServerIconModal = asDialog({ title: 'Upload Server Icon' })(() => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [uploading, setUploading] = useState(false);
    const [iconPreview, setIconPreview] = useState<string | null>(null);

    useEffect(() => {
        // Check if "server-icon.png" exists, and if so, retrieve and set it to iconPreview
        loadDirectory(uuid).then((files) => {
            const serverIconFile = files.find((file) => file.name === 'server-icon.png');
            if (serverIconFile) {
                getFileContents(uuid, 'server-icon.png')
                    .then((iconData) => setIconPreview(iconData))
                    .catch((err) => console.error('Failed to load server icon', err));
            }
        });
    }, [uuid]);

    const UploadServerIconSchema = Yup.object().shape({
        iconFile: Yup.mixed().required('A file is required'),
    });

    const processFile = async (file: File) => {
        // Ensure it's an image
        if (file && file.type.match(/image.*/)) {
            // Use Jimp to resize the image
            const image = await Jimp.read(URL.createObjectURL(file));
            image.resize(64, 64);
            const pngImageBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
            const pngImage = new File([pngImageBuffer], 'server-icon.png', { type: Jimp.MIME_PNG });
            return pngImage;
        }
        return null;
    };

    const handleSubmit = async (values: { iconFile: File | undefined }) => {
        setUploading(true);
        const pngImage = values.iconFile ? await processFile(values.iconFile) : null;
        if (pngImage) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                saveFileContents(uuid, 'server-icon.png', base64data)
                    .then(() => {
                        setUploading(false);
                        setIconPreview(URL.createObjectURL(pngImage));
                    })
                    .catch((err) => {
                        console.error('Failed to upload server icon', err);
                        setUploading(false);
                    });
            };
            reader.readAsDataURL(pngImage);
        }
    };

    return (
        <Formik
            initialValues={{ iconFile: undefined }}
            validationSchema={UploadServerIconSchema}
            onSubmit={handleSubmit}
        >
            {({ setFieldValue }) => (
                <Form>
                    {iconPreview && <img src={iconPreview} alt='Server Icon Preview' />}
                    <Field
                        name='iconFile'
                        type='file'
                        as='input'
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue('iconFile', event.currentTarget.files![0]);
                        }}
                    />
                    <Dialog.Footer>
                        <Button.Text onClick={() => console.log('Cancel button clicked.')}>Cancel</Button.Text>
                        <Button.Danger type='submit' color='red' disabled={uploading}>
                            Upload Icon
                        </Button.Danger>
                    </Dialog.Footer>
                </Form>
            )}
        </Formik>
    );
});

export default ({ className }: { className: string }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <UploadServerIconModal open={open} onClose={() => setOpen(false)} />
            <Button.Text onClick={() => setOpen(true)} className={className}>
                Upload Server Icon
            </Button.Text>
        </>
    );
};
