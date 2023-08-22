import { Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useEffect, useState } from 'react';
import CollapsibleTitledGreyBox from '@/components/elements/CollapsibleTitledGreyBox';
import tw from 'twin.macro';
import http from '@/api/http';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import FormikSwitch from '@/components/elements/FormikSwitch';
import StyledField from '@/components/elements/Field';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    http.post(`/api/client/servers/${uuid}/subdomains/deletesubdomain`, {
        selectedname: 'firecraft',
        selectedzone: 'foxomy.net',
        // selectedip: '67.174.206.154',
        // selectedport: '25565',
    })
        .then((response) => {
            if (response.data.error) {
                // Handle the error here
                console.error(response.data.error);
            } else {
                // Handle the success here
                console.log(response.data);
            }
        })
        .catch((error) => {
            // Handle any other errors here
            console.error(error);
        });
    return <ServerContentBlock title={'Minecraft'}>hi</ServerContentBlock>;
};
