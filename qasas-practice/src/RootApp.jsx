import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import App from './App.jsx';

const router = createBrowserRouter([
  {
    path: '*',
    element: <App />,
  },
]);

export default function RootApp() {
  return (
    <SettingsProvider>
      <RouterProvider router={router} />
    </SettingsProvider>
  );
}
