'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { DEFAULT_PAGE_TITLE } from '@/context/constants'
import dynamic from 'next/dynamic'
const LayoutProvider = dynamic(() => import('@/context/useLayoutContext').then((mod) => mod.LayoutProvider), {
  ssr: false,
})

import { TitleProvider } from '@/context/useTitleContext'
const AppProvidersWrapper = ({ children }) => {
  const authBasePath = process.env.NEXT_PUBLIC_NEXTAUTH_BASE_PATH || '/api/auth'
  const handleChangeTitle = () => {
    if (document.visibilityState == 'show') document.title = 'Please come back'
    else document.title = DEFAULT_PAGE_TITLE
  }
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const splash = document.querySelector('#splash-screen')
      const container = document.querySelector('#__next_splash')
      if (container?.hasChildNodes()) {
        splash?.classList.add('remove')
      } else if (container) {
        const observer = new MutationObserver(() => {
          if (container.hasChildNodes()) {
            splash?.classList.add('remove')
            observer.disconnect()
          }
        })
        observer.observe(container, { childList: true, subtree: true })
        return () => observer.disconnect()
      }
    }
    document.addEventListener('visibilitychange', handleChangeTitle)
    return () => {
      document.removeEventListener('visibilitychange', handleChangeTitle)
    }
  }, [])
  return (
    <SessionProvider
      basePath={authBasePath}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      refetchInterval={0}
    >
      <LayoutProvider>
        <TitleProvider>
       
            {children}
            <ToastContainer theme="colored" />

        </TitleProvider>
      </LayoutProvider>
    </SessionProvider>
  )
}
export default AppProvidersWrapper
