import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import pica from 'pica';
import tw from 'twin.macro';
import axios from 'axios';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import loadDirectory from '@/api/server/files/loadDirectory';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import { Actions, useStoreActions } from 'easy-peasy';
import { httpErrorToHuman } from '@/api/http';
import { ApplicationStore } from '@/state';
import FlashMessageRender from '@/components/FlashMessageRender';
import deleteFiles from '@/api/server/files/deleteFiles';
import { Dialog } from '@/components/elements/dialog';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';

const UploadServerIconModal = () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [uploading, setUploading] = useState(false);
    const [iconPreview, setIconPreview] = useState<string | null>(null);
    const [iconExists, setIconExists] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const DeleteServerIconButton = () => {
        const [visible, setVisible] = useState(false);
        const [isLoading, setIsLoading] = useState(false);
        const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
        const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

        const onDelete = () => {
            setIsLoading(true);
            clearFlashes('server:edit');
            deleteFiles(uuid, '/', ['server-icon.png'])
                .then(() => {
                    setIsLoading(false);
                    setIconExists(false);
                    setIconPreview(null);
                    clearFlashes();
                    addFlash({ key: 'server:edit', type: 'success', title: 'Success', message: 'Server icon deleted' });
                })
                .catch((error) => {
                    console.error(error);
                    clearFlashes();
                    addFlash({ key: 'server:edit', type: 'error', title: 'Error', message: httpErrorToHuman(error) });
                    setIsLoading(false);
                    setVisible(false);
                });
        };

        return (
            <>
                <Dialog.Confirm
                    open={visible}
                    onClose={() => setVisible(false)}
                    title={'Delete Server Icon'}
                    confirm={'Delete'}
                    onConfirmed={onDelete}
                >
                    <SpinnerOverlay visible={isLoading} />
                    Are you sure you want to delete the server icon?
                </Dialog.Confirm>
                <Button.Danger
                    variant={Button.Variants.Secondary}
                    className={'flex-1 sm:flex-none border-transparent'}
                    onClick={() => setVisible(true)}
                >
                    Delete Server Icon
                </Button.Danger>
            </>
        );
    };

    useEffect(() => {
        loadDirectory(uuid, '/')
            .then((files) => {
                const iconExists = files.some((file) => file.name === 'server-icon.png');
                setIconExists(iconExists);
                if (iconExists) {
                    return getFileDownloadUrl(uuid, 'server-icon.png');
                } else {
                    throw new Error('No server icon found');
                }
            })
            .then(setIconPreview)
            .catch((err) => console.error('Failed to load server icon', err));
    }, [uuid]);

    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            throw new Error('File is not an image');
        }

        const img = document.createElement('img');
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;

        return new Promise<File | null>((resolve, reject) => {
            img.onload = async () => {
                await pica().resize(img, canvas);
                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob from image data'));
                        return;
                    }
                    const resizedFile = new File([blob], 'server-icon.png', {
                        type: 'image/png',
                    });
                    resolve(resizedFile);
                }, 'image/png');
            };
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleButtonClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files ? event.currentTarget.files[0] : null;
        if (file) {
            setUploading(true);
            try {
                const pngImage = await processFile(file);
                if (pngImage) {
                    // Create a FormData object to hold the file for upload
                    const formData = new FormData();
                    formData.append('files', pngImage);

                    // Retrieve the URL to upload the file to
                    const uploadUrl = await getFileUploadUrl(uuid);

                    axios
                        .post(uploadUrl, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        })
                        .then(() => {
                            setUploading(false);
                            setIconExists(true);
                            // Use the local object URL for the preview as the file is now uploaded
                            setIconPreview(URL.createObjectURL(pngImage));
                            // Clear existing flashes and add success message
                            clearFlashes();
                            addFlash({
                                key: 'server:edit',
                                type: 'success',
                                title: 'Success',
                                message: 'Server icon updated',
                            });
                        })
                        .catch((err) => {
                            console.error('Failed to upload server icon', err);
                            clearFlashes();
                            addFlash({
                                key: 'server:edit',
                                type: 'error',
                                title: 'Error',
                                message: httpErrorToHuman(err),
                            });
                            setUploading(false);
                        });
                }
            } catch (error) {
                console.error('Failed to process image', error);
                clearFlashes();
                addFlash({ key: 'server:edit', type: 'error', title: 'Error', message: 'File is not an image' });

                setUploading(false);
            }
        }
    };

    return (
        <>
            <div css={tw`flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6`}>
                <FlashMessageRender byKey={'server:edit'} />
                {iconExists ? (
                    <div>
                        {iconPreview && (
                            <div>
                                <img
                                    src={iconPreview}
                                    alt='Server Icon Preview'
                                    style={{ maxWidth: '100%', borderRadius: '4px' }}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div>A server icon does not exist.</div>
                )}
                <Button onClick={handleButtonClick} disabled={uploading}>
                    {iconExists ? 'Change Server Icon' : 'Upload Server Icon'}
                </Button>
                <input
                    id='iconFile'
                    name='iconFile'
                    type='file'
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileChange}
                />
                {uploading && <div>Uploading...</div>}
                <DeleteServerIconButton />
            </div>
        </>
    );
};

export default UploadServerIconModal;
