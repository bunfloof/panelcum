import styled from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded no-underline text-neutral-200 items-center bg-neutral-700 p-4 border border-transparent transition-colors duration-150 overflow-hidden`};

    ${(props) => props.$hoverable !== false && tw`hover:border-neutral-500`};

    & .icon {
        ${tw`rounded-full w-16 flex items-center justify-center bg-neutral-500 p-3`};
    }

    .bun-theme-light & {
        ${tw`bg-zinc-200 text-zinc-900`} // Light theme background and text colors

        &:hover {
            ${tw`text-zinc-600`}// Light theme hover background and text colors
        }

        & .icon {
            ${tw`rounded-full w-16 flex items-center justify-center bg-zinc-500 p-3`};
        }
    }
`;
