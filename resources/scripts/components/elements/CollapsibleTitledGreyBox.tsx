import React, { memo, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import tw, { TwStyle } from 'twin.macro';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    containerCSS?: TwStyle; // change the name to avoid confusion with Emotion's css prop
}

const CollapsibleTitledGreyBox = ({ icon, title, children, defaultOpen = false, containerCSS }: Props) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = useCallback(() => {
        setIsOpen((prev) => !prev);
    }, []);

    return (
        <div css={[tw`rounded shadow-md bg-neutral-700`, containerCSS]} data-theme-target='collapsible-box'>
            <div
                css={tw`bg-neutral-900 rounded-t p-2 border-b border-black cursor-pointer hover:bg-neutral-600 transition-colors duration-200`}
                onClick={toggleOpen}
                data-theme-target='collapsible-box-2'
            >
                {typeof title === 'string' ? (
                    <p css={tw`text-sm uppercase`}>
                        {icon && <FontAwesomeIcon icon={icon} css={tw`mr-2 text-neutral-300`} />}
                        {title}
                        <FontAwesomeIcon
                            icon={isOpen ? faChevronDown : faChevronRight}
                            css={tw`ml-2 text-neutral-300`}
                        />
                    </p>
                ) : (
                    title
                )}
            </div>
            <div
                css={[
                    tw`overflow-hidden transition-all duration-250 ease-in-out overflow-y-auto`,
                    isOpen ? tw`max-h-[75vh]` : tw`max-h-0`, // adjust the height here, e.g., to 75% of the viewport height
                ]}
            >
                <div css={tw`p-3`}>{children}</div>
            </div>
        </div>
    );
};

export default memo(CollapsibleTitledGreyBox, isEqual);
