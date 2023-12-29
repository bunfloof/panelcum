import React, { lazy, useState, useContext, createContext, useEffect, ReactNode } from 'react';
import { hot } from 'react-hot-loader/root';
import { Route, Router, Switch } from 'react-router-dom';
import { StoreProvider } from 'easy-peasy';
import { store } from '@/state';
import { SiteSettings } from '@/state/settings';
import ProgressBar from '@/components/elements/ProgressBar';
import { NotFound } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import { history } from '@/components/history';
import { setupInterceptors } from '@/api/interceptors';
import AuthenticatedRoute from '@/components/elements/AuthenticatedRoute';
import { ServerContext } from '@/state/server';
import '@/assets/tailwind.css';
import Spinner from '@/components/elements/Spinner';

const DashboardRouter = lazy(() => import(/* webpackChunkName: "dashboard" */ '@/routers/DashboardRouter'));
const ServerRouter = lazy(() => import(/* webpackChunkName: "server" */ '@/routers/ServerRouter'));
const AuthenticationRouter = lazy(() => import(/* webpackChunkName: "auth" */ '@/routers/AuthenticationRouter'));

// Start of dark theme
// Define a type for the context
type ThemeContextType = {
    theme: string;
    toggleTheme: () => void;
};

// Provide a more meaningful initial value for the context
export const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => {
        console.log('Toggle theme function not implemented yet');
    },
});

// Type the props for ThemeProvider
type ThemeProviderProps = {
    children: ReactNode;
};

const ThemeProvider = ({ children }: ThemeProviderProps) => {
    // Define an array of available themes
    const themes = ['light', 'pterodactyl', 'dragon'];
    const [theme, setTheme] = useState(themes[0]); // Default to the first theme

    const toggleTheme = () => {
        // Find the index of the current theme
        const currentThemeIndex = themes.indexOf(theme);
        // Compute the index of the next theme
        const nextThemeIndex = (currentThemeIndex + 1) % themes.length;
        // Set the next theme
        const newTheme = themes[nextThemeIndex];
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        console.log(`Theme changed to: bun-theme-${newTheme}`); // Debugging log
    };

    useEffect(() => {
        // Generate a list of all possible theme classes
        const allThemeClasses = themes.map((t) => `bun-theme-${t}`);
        // Remove all theme classes first
        allThemeClasses.forEach((cls) => document.body.classList.remove(cls));
        // Then add the current theme class
        document.body.classList.add(`bun-theme-${theme}`);
    }, [theme]);

    useEffect(() => {
        const localTheme = localStorage.getItem('theme');
        if (localTheme && themes.includes(localTheme)) {
            setTheme(localTheme);
        }
    }, []);

    return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

const ThemeToggle = () => {
    const { toggleTheme } = useContext(ThemeContext);

    return <button onClick={toggleTheme}>Toggle Theme</button>;
};

// End of dark theme
interface ExtendedWindow extends Window {
    SiteConfiguration?: SiteSettings;
    PterodactylUser?: {
        uuid: string;
        username: string;
        email: string;
        /* eslint-disable camelcase */
        root_admin: boolean;
        use_totp: boolean;
        language: string;
        updated_at: string;
        created_at: string;
        /* eslint-enable camelcase */
    };
}

setupInterceptors(history);

const App = () => {
    const { PterodactylUser, SiteConfiguration } = window as ExtendedWindow;
    if (PterodactylUser && !store.getState().user.data) {
        store.getActions().user.setUserData({
            uuid: PterodactylUser.uuid,
            username: PterodactylUser.username,
            email: PterodactylUser.email,
            language: PterodactylUser.language,
            rootAdmin: PterodactylUser.root_admin,
            useTotp: PterodactylUser.use_totp,
            createdAt: new Date(PterodactylUser.created_at),
            updatedAt: new Date(PterodactylUser.updated_at),
        });
    }

    if (!store.getState().settings.data) {
        store.getActions().settings.setSettings(SiteConfiguration!);
    }

    return (
        <>
            <GlobalStylesheet />
            <ThemeProvider>
                <StoreProvider store={store}>
                    <ThemeToggle />
                    <ProgressBar />
                    <div css={tw`mx-auto w-auto`}>
                        <Router history={history}>
                            <Switch>
                                <Route path={'/auth'}>
                                    <Spinner.Suspense>
                                        <AuthenticationRouter />
                                    </Spinner.Suspense>
                                </Route>
                                <AuthenticatedRoute path={'/server/:id'}>
                                    <Spinner.Suspense>
                                        <ServerContext.Provider>
                                            <ServerRouter />
                                        </ServerContext.Provider>
                                    </Spinner.Suspense>
                                </AuthenticatedRoute>
                                <AuthenticatedRoute path={'/'}>
                                    <Spinner.Suspense>
                                        <DashboardRouter />
                                    </Spinner.Suspense>
                                </AuthenticatedRoute>
                                <Route path={'*'}>
                                    <NotFound />
                                </Route>
                            </Switch>
                        </Router>
                    </div>
                </StoreProvider>
            </ThemeProvider>
        </>
    );
};

export default hot(App);
