import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full h-12 bg-black shadow overflow-x-auto`};

    & > div {
        ${tw`flex items-center text-base mx-auto px-2`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`relative inline-flex items-center py-3 px-4 text-neutral-300 no-underline whitespace-nowrap transition-all duration-150 z-10`}; // Add z-10

            &:not(:first-of-type) {
                ${tw`ml-0`};
            }

            &::before {
                content: '';
                ${tw`absolute inset-2 bg-transparent rounded-md transition-all duration-150`};
                z-index: -1; // Acab z-index: -1
            }

            &:hover {
                ${tw`text-neutral-100`};

                &::before {
                    ${tw`bg-neutral-500`};
                }
            }

            &:active,
            &.active {
                ${tw`text-neutral-100`};
                box-shadow: inset 0 -2px ${theme`colors.cyan.600`.toString()};
            }
        }
    }
`;

export default SubNavigation;
