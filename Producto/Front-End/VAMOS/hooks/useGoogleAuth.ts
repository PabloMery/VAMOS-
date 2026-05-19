import * as React from 'react';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ['profile', 'email'],
});

export const useGoogleAuth = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [response, setResponse] = React.useState<any>(null);

  const iniciarSesion = async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      
      const userInfo = await GoogleSignin.signIn();
      
      // ✅ Esta es la extracción correcta para la versión moderna de la librería
      const idToken = userInfo.data?.idToken;

      if (idToken) {
        setResponse({ type: 'success', authentication: { idToken } });
      } else {
        setError('No se obtuvo el pase de seguridad de Google');
      }
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('El usuario cerró la ventana de Google');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        setError('El inicio de sesión ya está en proceso');
      } else {
        setError('Error de Google: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return { iniciarSesion, response, loading, error };
};