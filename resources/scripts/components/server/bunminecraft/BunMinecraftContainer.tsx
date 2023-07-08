import { Field, Form, Formik, FormikHelpers } from 'formik';
import React, { useEffect, useState } from 'react';
import CollapsibleTitledGreyBox from '@/components/elements/CollapsibleTitledGreyBox';
import tw from 'twin.macro';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { ServerContext } from '@/state/server';
import getFileContents from '@/api/server/files/getFileContents';
import { httpErrorToHuman } from '@/api/http';
import saveFileContents from '@/api/server/files/saveFileContents';
import FormikSwitch from '@/components/elements/FormikSwitch';
import StyledField from '@/components/elements/Field';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import { Button } from '@/components/elements/button/index';

const parseProperties = (content: string): { [key: string]: string | boolean } => {
    const lines = content.split('\n');
    const properties: { [key: string]: string | boolean } = {};
    lines.forEach((line: string) => {
        if (line[0] !== '#' && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');

            // parse these specific keys into boolean
            if (
                [
                    'spawn-monsters',
                    'spawn-npcs',
                    'spawn-animals',
                    'allow-flight',
                    'pvp',
                    'enable-command-block',
                    'online-mode',
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
    const [error, setError] = useState<string>('');
    const [properties, setProperties] = useState<{ [key: string]: string | boolean }>({});

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
            type: 'number',
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
            name: 'whitelist',
            description: 'Enable or disable whitelist system.',
            label: 'Whitelist',
            component: FormikSwitch,
        },
        {
            name: 'enforce-whitelist',
            description: 'Enable or whitelist enforcement.',
            label: 'Enforce whitelist',
            component: FormikSwitch,
        },
        {
            name: 'motd',
            description: 'Sets the server MOTD.',
            label: 'Enforce whitelist',
            placeholder: 'A Gay Minecraft Server',
            component: StyledField,
        },
        {
            name: 'max-players',
            label: 'Player Slots',
            type: 'number',
            placeholder: '20',
            component: StyledField,
        },
    ];

    const usedKeys = [...configKeys, ...playerConfigKeys, ...serverConfigKeys].map((key) => key.name);

    const otherKeys = Object.keys(properties).filter((key) => !usedKeys.includes(key));

    useEffect(() => {
        setError('');
        getFileContents(uuid, '/server.properties')
            .then((fetchedContent) => {
                setContent(fetchedContent);
                setProperties(parseProperties(fetchedContent));
                setIsLoading(false);
            })
            .catch((error: Error) => {
                console.error(error);
                setError(httpErrorToHuman(error));
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
                    // Convert boolean values to string in case of coems
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
            })
            .catch((error: Error) => {
                console.error(error);
                setSubmitting(false);
                setError(httpErrorToHuman(error));
            });
    };

    const initialValues = parseProperties(content);

    useEffect(() => {
        console.log('Initial values:', initialValues);
    }, [initialValues]);

    return (
        <ServerContentBlock title={'Minecraft'}>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <Formik initialValues={properties} onSubmit={handleFormSubmit}>
                    {({ isSubmitting }) => (
                        <Form>
                            <CollapsibleTitledGreyBox title={'World'} containerCSS={tw`mb-4`} defaultOpen>
                                <div css={tw`grid grid-cols-3 gap-4`}>
                                    {configKeys.map((key) => {
                                        if (Object.prototype.hasOwnProperty.call(properties, key.name)) {
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
                                        }
                                        return null;
                                    })}
                                </div>
                            </CollapsibleTitledGreyBox>

                            <CollapsibleTitledGreyBox title={'Player'} defaultOpen containerCSS={tw`mb-4`}>
                                <div css={tw`grid grid-cols-3 gap-4`}>
                                    {playerConfigKeys.map((key) => {
                                        if (Object.prototype.hasOwnProperty.call(initialValues, key.name)) {
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
                                        }
                                        return null;
                                    })}
                                </div>
                            </CollapsibleTitledGreyBox>

                            <CollapsibleTitledGreyBox title={'Server'} defaultOpen>
                                <div css={tw`grid grid-cols-3 gap-4`}>
                                    {serverConfigKeys.map((key) => {
                                        if (Object.prototype.hasOwnProperty.call(initialValues, key.name)) {
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
                                        }
                                        return null;
                                    })}
                                </div>
                            </CollapsibleTitledGreyBox>
                            <CollapsibleTitledGreyBox
                                title={'Other'}
                                defaultOpen
                                containerCSS={tw`mb-4 overflow-y-auto`}
                            >
                                <div css={tw`grid grid-cols-3 gap-4`}>
                                    {otherKeys.map((key) => (
                                        <div key={key}>
                                            <Label>{key}</Label>
                                            <Field as={StyledField} name={key} />
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleTitledGreyBox>

                            <div css={tw`mt-6 sm:flex items-center justify-end`}>
                                <Button type='submit' disabled={isSubmitting}>
                                    Save
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </ServerContentBlock>
    );
};
