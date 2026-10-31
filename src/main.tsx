import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/JourneysApp';
import { LocaleProvider } from './i18n';
import { CloudProvider, useCloud } from './cloud/CloudProvider';
import { useScrollMaterial } from './hooks/useScrollMaterial';
import AppUpdate from './components/AppUpdate';
import { InstallProvider } from './components/InstallHelp';
import { MapPreferencesProvider } from './MapPreferences';
import { MascotPreferencesProvider } from './MascotPreferences';
import './typography.css';
import './styles.css';
import './theme.css';
import './apple-design.css';
function Root() { useScrollMaterial(); const { scope, ready } = useCloud(); return <>{ready ? <MapPreferencesProvider key={scope}><MascotPreferencesProvider key={scope}><App/></MascotPreferencesProvider></MapPreferencesProvider> : <p role="status">Détours…</p>}<AppUpdate/></>; }
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><LocaleProvider><CloudProvider><InstallProvider><Root /></InstallProvider></CloudProvider></LocaleProvider></React.StrictMode>);
