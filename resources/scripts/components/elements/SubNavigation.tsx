import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full bg-neutral-700 shadow overflow-x-auto 2xl:w-48 2xl:h-full 2xl:fixed`};

    & > div {
        ${tw`flex items-center text-sm mx-auto px-2 2xl:flex-col 2xl:items-start 2xl:w-full 2xl:mx-0`};
        max-width: 1200px;

        & > a,
        & > div {
            ${tw`inline-block py-3 px-4 text-neutral-300 no-underline whitespace-nowrap transition-all duration-150 2xl:block`};

            &:not(:first-of-type) {
                ${tw`ml-2 2xl:mt-2 2xl:ml-0`};
            }

            &:hover {
                ${tw`text-neutral-100`};
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
