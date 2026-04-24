// pages/_app.js
import '../styles/globals.css'
import { AuthProvider } from '../lib/AuthContext'
import { Toaster } from 'react-hot-toast'
import Navbar from '../components/ui/Navbar'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <div className="grain min-h-screen">
        <Navbar />
        <Component {...pageProps} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              background: '#1a0e07',
              color: '#f9f6f0',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#6ee7b7', secondary: '#1a0e07' } },
            error:   { iconTheme: { primary: '#fca5a5', secondary: '#1a0e07' } },
          }}
        />
      </div>
    </AuthProvider>
  )
}
