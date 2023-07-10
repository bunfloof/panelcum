import { Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useEffect, useState } from 'react';
import CollapsibleTitledGreyBox from '@/components/elements/CollapsibleTitledGreyBox';
import tw from 'twin.macro';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import getFileContents from '@/api/server/files/getFileContents';
//import { httpErrorToHuman } from '@/api/http';
import saveFileContents from '@/api/server/files/saveFileContents';
import FormikSwitch from '@/components/elements/FormikSwitch';
import StyledField from '@/components/elements/Field';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';
import UploadServerIconModal from '@/components/server/bunminecraft/UploadServerIconModal';

const parseProperties = (content: string): { [key: string]: string | boolean } => {
    const lines = content.split('\n');
    const properties: { [key: string]: string | boolean } = {};
    lines.forEach((line: string) => {
        if (line[0] !== '#' && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');

            if (
                [
                    'spawn-monsters',
                    'spawn-npcs',
                    'spawn-animals',
                    'allow-flight',
                    'pvp',
                    'enable-command-block',
                    'online-mode',
                    'white-list',
                    'enforce-whitelist',
                ].includes(key)
            ) {
                properties[key] = value.toLowerCase() === 'true';
            } else {
                properties[key] = value;
            }
        }
    });
    return properties;
};

interface ConfigKey {
    name: string;
    description?: string;
    label: string;
    component: any;
    options?: { value: string; label: string }[];
    placeholder?: string;
    type?: string;
}

export default () => {
    const [content, setContent] = useState<string>('');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    //const [error, setError] = useState<string>('');
    const [properties, setProperties] = useState<{ [key: string]: string | boolean }>({});
    const [originalProperties, setOriginalProperties] = useState<{ [key: string]: string | boolean }>({});

    const [isLoading, setIsLoading] = useState(true);

    const configKeys: ConfigKey[] = [
        {
            name: 'spawn-monsters',
            description: 'Enable or disable the spawning of monsters.',
            label: 'Spawn Monsters',
            component: FormikSwitch,
        },
        {
            name: 'spawn-npcs',
            description: 'Enable or disable the spawning of NPCs.',
            label: 'Spawn NPCs',
            component: FormikSwitch,
        },
        {
            name: 'spawn-animals',
            description: 'Enable or disable the spawning of animals.',
            label: 'Spawn Animals',
            component: FormikSwitch,
        },
        {
            name: 'enable-command-block',
            description: 'Enable or disable command blocks.',
            label: 'Command blocks',
            component: FormikSwitch,
        },
        { name: 'level-name', label: 'level name', placeholder: 'Level Name', component: StyledField },
        {
            name: 'view-distance',
            label: 'view distance',
            placeholder: '10',
            component: StyledField,
        },
        { name: 'level-seed', label: 'level seed', placeholder: 'Level Seed', component: StyledField },
        {
            name: 'difficulty',
            label: 'difficulty',
            component: Select,
            options: [
                { value: 'peaceful', label: 'Peaceful' },
                { value: 'easy', label: 'Easy' },
                { value: 'normal', label: 'Normal' },
                { value: 'hard', label: 'Hard' },
            ],
        },
        {
            name: 'gamemode',
            label: 'Gamemode',
            component: Select,
            options: [
                { value: 'survival', label: 'Survival' },
                { value: 'creative', label: 'Creative' },
                { value: 'adventure', label: 'Adventure' },
                { value: 'spectator', label: 'Spectator' },
            ],
        },
    ];

    const playerConfigKeys: ConfigKey[] = [
        {
            name: 'pvp',
            description: 'Enable or disable player versus player combat.',
            label: 'PvP',
            component: FormikSwitch,
        },
        {
            name: 'allow-flight',
            description: 'Allow or disallow players to fly.',
            label: 'Allow Flight',
            component: FormikSwitch,
        },
    ];

    const serverConfigKeys: ConfigKey[] = [
        {
            name: 'online-mode',
            description: 'Enable or disable online-mode.',
            label: 'online mode',
            component: FormikSwitch,
        },
        {
            name: 'white-list',
            description: 'Enable or disable allow-list system.',
            label: 'Allow-list',
            component: FormikSwitch,
        },
        {
            name: 'enforce-whitelist',
            description: 'Enable or allow-list enforcement.',
            label: 'Enforce allow-list',
            component: FormikSwitch,
        },

        {
            name: 'motd',
            label: 'MOTD',
            placeholder: 'A Gay Minecraft Server',
            component: StyledField,
        },
        {
            name: 'max-players',
            label: 'Player Slots',
            placeholder: '20',
            component: StyledField,
        },
    ];

    const usedKeys = [...configKeys, ...playerConfigKeys, ...serverConfigKeys].map((key) => key.name);

    const otherKeys = Object.keys(properties).filter((key) => !usedKeys.includes(key));
    useEffect(() => {
        //setError('');
        getFileContents(uuid, '/server.properties')
            .then((fetchedContent) => {
                setContent(fetchedContent);
                const parsedProperties = parseProperties(fetchedContent);
                setProperties(parsedProperties);
                setOriginalProperties(parsedProperties);
                setIsLoading(false);
            })
            .catch((error: Error) => {
                console.error(error);
                //setError(httpErrorToHuman(error));
            });
    }, [uuid]);

    useEffect(() => {
        console.log(content);
    }, [content]);

    const handleFormSubmit = (values: { [key: string]: string | boolean }, { setSubmitting }: FormikHelpers<any>) => {
        const originalLines = content.split('\n');
        const newLines = [];
        for (const line of originalLines) {
            if (line.includes('=')) {
                const [key] = line.split('=');
                if (key in values) {
                    let value = values[key];
                    if (typeof value === 'boolean') {
                        value = value ? 'true' : 'false';
                    }
                    newLines.push(`${key}=${value}`);
                } else {
                    newLines.push(line);
                }
            } else {
                newLines.push(line);
            }
        }
        const propertiesContent = newLines.join('\n');

        saveFileContents(uuid, '/server.properties', propertiesContent)
            .then(() => {
                setSubmitting(false);
                setContent(propertiesContent);
                setProperties(parseProperties(propertiesContent));
                setOriginalProperties(parseProperties(propertiesContent));
            })
            .catch((error: Error) => {
                console.error(error);
                setSubmitting(false);
                //setError(httpErrorToHuman(error));
            });
    };

    const checkForChanges = (keys: ConfigKey[], currentValues: { [key: string]: string | boolean }) => {
        for (const key of keys) {
            if (originalProperties[key.name] !== currentValues[key.name]) {
                return true;
            }
        }
        return false;
    };

    // useEffect(() => {
    //     console.log('Initial values:', initialValues);
    // }, [initialValues]);

    const renderConfigKeys = (configKeys: ConfigKey[], formikProps: any) => {
        const jsxComponents = configKeys
            .filter((key: ConfigKey) => Object.prototype.hasOwnProperty.call(formikProps.values, key.name))
            .map((key: ConfigKey) => {
                if (key.component === Select) {
                    return (
                        <div key={key.name}>
                            {key.label && <Label>{key.label}</Label>}
                            <Field as={Select} name={key.name}>
                                {key.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Field>
                        </div>
                    );
                } else {
                    return (
                        <div key={key.name}>
                            {key.label && <Label>{key.label}</Label>}
                            {React.createElement(key.component, {
                                name: key.name,
                                description: key.description,
                                placeholder: key.placeholder,
                                type: key.type,
                            })}
                        </div>
                    );
                }
            });

        return jsxComponents;
    };

    const renderSaveButton = (configKeys: ConfigKey[], formikProps: any) => {
        // Save changes button
        if (checkForChanges(configKeys, formikProps.values)) {
            return (
                <div key='saveButton' css={tw`mt-6 sm:flex items-center justify-end`}>
                    {!formikProps.isSubmitting ? <p>You have unsaved changes</p> : <p>Changes saved</p>}
                    <Button
                        type='submit'
                        disabled={formikProps.isSubmitting}
                        onClick={formikProps.handleSubmit}
                        css={tw`ml-2`}
                    >
                        Save changes
                    </Button>
                </div>
            );
        }
        return null;
    };

    return (
        <ServerContentBlock title={'Minecraft'}>
            {isLoading ? (
                <p>Reading your server.properties file...</p>
            ) : (
                <Formik initialValues={properties} onSubmit={handleFormSubmit}>
                    {(formikProps) => (
                        <Form>
                            <CollapsibleTitledGreyBox title={'World'} containerCSS={tw`mb-4`} defaultOpen>
                                <div css={tw`grid grid-cols-3 gap-4`}>{renderConfigKeys(configKeys, formikProps)}</div>
                                {renderSaveButton(configKeys, formikProps)}
                            </CollapsibleTitledGreyBox>

                            <CollapsibleTitledGreyBox title={'Player'} defaultOpen containerCSS={tw`mb-4`}>
                                <div css={tw`grid grid-cols-3 gap-4`}>
                                    {renderConfigKeys(playerConfigKeys, formikProps)}
                                </div>
                                {renderSaveButton(playerConfigKeys, formikProps)}
                            </CollapsibleTitledGreyBox>

                            <CollapsibleTitledGreyBox title={'Server'} defaultOpen containerCSS={tw`mb-4`}>
                                <UploadServerIconModal />
                                <div css={tw`grid grid-cols-3 gap-4`}>
                                    {renderConfigKeys(serverConfigKeys, formikProps)}
                                </div>
                                {renderSaveButton(serverConfigKeys, formikProps)}
                            </CollapsibleTitledGreyBox>

                            <CollapsibleTitledGreyBox
                                title={'Other'}
                                defaultOpen
                                containerCSS={tw`mb-4 overflow-y-auto`}
                            >
                                <div css={tw`grid grid-cols-3 gap-4`}>
                                    {otherKeys
                                        .filter((key) => Object.prototype.hasOwnProperty.call(properties, key))
                                        .map((key) => (
                                            <div key={key}>
                                                <Label>{key}</Label>
                                                <Field as={StyledField} name={key} />
                                            </div>
                                        ))}
                                </div>
                                {renderSaveButton(
                                    otherKeys.map((key) => ({
                                        name: key,
                                        label: key,
                                        component: StyledField,
                                    })),
                                    formikProps
                                )}
                            </CollapsibleTitledGreyBox>
                        </Form>
                    )}
                </Formik>
            )}
        </ServerContentBlock>
    );
};
