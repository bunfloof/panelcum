import tw, { theme } from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';

export default createGlobalStyle`
    body {
        ${tw`font-sans bg-neutral-800 text-neutral-200`};
        letter-spacing: 0.015em;
    }

    .bun-theme-light {
        ${tw`font-sans bg-zinc-50 text-zinc-900`};
    }

    .bun-theme-light body {
        ${tw`font-sans bg-zinc-800`};
    }

    .bun-theme-light p:not(.text-white):not(.font-mono) {
        ${tw`font-sans text-zinc-900`};
    }
    
    .bun-theme-light label {
        color: ${tw`text-zinc-900`};
    }

    .bun-theme-light .bg-black {
        background-color: ${tw`bg-zinc-300`};
    }

    .bun-theme-light .bg-gray-600 {
        background-color: ${tw`bg-zinc-200`};
    }
    
    .bun-theme-light .bg-gray-700 {
        background-color: ${tw`bg-zinc-200`};
    }

    .bun-theme-light .bg-gray-800 {
        background-color: ${tw`bg-zinc-300`};
    }

    .bun-theme-light .bg-neutral-700 {
        background-color: #E4E4E7;
    }

    .bun-theme-light .bg-neutral-800 {
        background-color: ${tw`bg-zinc-300`};
    }

    .bun-theme-light .bg-neutral-900 {
        background-color: ${tw`bg-zinc-300`};
    }
    
    .bun-theme-light .border-gray-800  {
        ${tw`border-zinc-400 `};
    }

    .bun-theme-light .text-gray-200 {
        ${tw`text-zinc-900`};
    }

    .bun-theme-light .text-gray-50 {
        ${tw`text-zinc-800`};
    }

    .bun-theme-light .text-neutral-300 {
        ${tw`text-zinc-800`};
    }

    .bun-theme-light .text-neutral-200 {
        ${tw`text-zinc-900`};
    }

    .bun-theme-light .text-neutral-100 {
        ${tw`text-zinc-800`};
    }
        
    .bun-theme-light [data-theme-target="collapsible-box"] {
        ${tw`bg-zinc-200`};
    }

    .bun-theme-light [data-theme-target="collapsible-box-2"] {
        ${tw`bg-zinc-300 border-b border-zinc-500`};

        p {
            ${tw`text-zinc-900`};
            svg {
                ${tw`text-zinc-800`} /* Replace with the color you want */
                ${tw`transition-colors duration-200`}; /* Optional: For smooth color transitions */
            }
        }

        &:hover {
            ${tw`bg-zinc-200`}
        }

    }

    .bun-theme-light [data-theme-target="sub-navigation"] {
        ${tw`bg-zinc-200 border-b border-zinc-400`};
    
        a {
            ${tw`text-zinc-500`} /* Normal state text color */
            ${tw`transition-all duration-150`}; /* Smooth transition */
    
            &::before {
                content: '';
                ${tw`absolute inset-1 bg-transparent rounded-md transition-all duration-150`};
                z-index: -1;
            }
    
            &::after {
                content: '';
                ${tw`absolute left-4 right-4 h-0.5 bg-transparent`};
                bottom: -3px;
                box-shadow: inset 0 -2px #0891b2;
                opacity: 0;
            }
    
            /* Hover state */
            &:hover {
                ${tw`text-zinc-950`}
    
                &::before {
                    ${tw`bg-zinc-300`};
                }
            }
    
            /* Active state */
            &:active,
            &.active {
                ${tw`text-zinc-950`};
    
                &::after {
                    opacity: 1;
                }
            }
        }
    }

    .bun-theme-light textarea {
        color: ${theme`colors.zinc.950`.toString()} !important;
        border-color: ${theme`colors.zinc.400`.toString()} !important;
        background-color: ${theme`colors.zinc.300`.toString()} !important;
    }

    .bun-theme-light input {
        color: ${theme`colors.zinc.950`.toString()} !important;
        border-color: ${theme`colors.zinc.400`.toString()} !important;
        background-color: ${theme`colors.zinc.300`.toString()} !important;
    }

    .bun-theme-light select {
        color: ${theme`colors.zinc.950`.toString()} !important;
        border-color: ${theme`colors.zinc.400`.toString()} !important;
        background-color: ${theme`colors.zinc.300`.toString()} !important;
        background-image: url('data:image/svg+xml;utf8,<svg fill="%2327272a" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>') !important;
    }

    .bun-theme-light [data-theme-target="sub-navigation"] {
        ${tw`bg-zinc-200`};
    }
    
    h1, h2, h3, h4, h5, h6 {
        ${tw`font-medium tracking-normal font-header`};
    }

    p {
        ${tw`text-neutral-200 leading-snug font-sans`};
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Scroll Bar Style */
    ::-webkit-scrollbar {
        background: none;
        width: 16px;
        height: 16px;
    }

    ::-webkit-scrollbar-thumb {
        border: solid 0 rgb(0 0 0 / 0%);
        border-right-width: 4px;
        border-left-width: 4px;
        -webkit-border-radius: 9px 4px;
        -webkit-box-shadow: inset 0 0 0 1px hsl(211, 10%, 53%), inset 0 0 0 4px hsl(209deg 18% 30%);
    }

    ::-webkit-scrollbar-track-piece {
        margin: 4px 0;
    }

    ::-webkit-scrollbar-thumb:horizontal {
        border-right-width: 0;
        border-left-width: 0;
        border-top-width: 4px;
        border-bottom-width: 4px;
        -webkit-border-radius: 4px 9px;
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }
`;
