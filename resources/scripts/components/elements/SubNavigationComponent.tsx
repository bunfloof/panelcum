import React, { ReactNode } from 'react';
import SubNavigation from '@/components/elements/SubNavigation';

interface SubNavigationComponentProps {
    children: ReactNode;
}

export default function SubNavigationComponent({ children }: SubNavigationComponentProps) {
    return (
        <SubNavigation>
            <div className='flex z-[2000]'>{children}</div>
        </SubNavigation>
    );
}
