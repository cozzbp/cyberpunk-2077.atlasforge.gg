import Head from 'next/head'
import { AppContextProvider } from '@/context/AppContext'
import toast, { Toaster } from 'react-hot-toast';
import Script from 'next/script'
import styles from '@/styles/_app.module.css'
import { useRouter, usePathname } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import NavBar from '@/components/NavBar'
import '@/styles/globals.css'


export default function App({ Component, pageProps }) {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top
  const pathname = usePathname()
  //const gameKey = 
  return (
    <>
      <Script id="hydro_config" type="text/javascript">{`window.Hydro_tagId = "e0c7acd3-39f2-4330-8287-1048d8c1bdab";`}</Script>
      <Script id="hydro_script" type="text/javascript" src="https://track.hydro.online/" />
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-2ZVJ5ERL6B" />
      <Script id="google-analytics">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
  
            gtag('config', 'G-2ZVJ5ERL6B');
          `}
      </Script>
      <Head>
        <script id="nitro-script1" type="text/javascript" async data-cfasync={false}>{`window.nitroAds=window.nitroAds||{createAd:function(){return new Promise(e=>{window.nitroAds.queue.push(["createAd",arguments,e])})},addUserToken:function(){window.nitroAds.queue.push(["addUserToken",arguments])},queue:[]};`}</script>
        <script id="nitro-script2" type="text/javascript" async src="https://s.nitropay.com/ads-1741.js" data-cfasync={false} />

        <title>ATLAS FORGE | Interactive Game Maps and Guides</title>
        <meta name="description"
          content="Interactive Game Maps and Guides for Cyberpunk 2077 Phantom Liberty, Diablo 4, WoW Classic, and more to come!"
          key="desc"
        />

        <meta property="og:title" content={`ATLAS FORGE | Interactive Game Maps and Guides`} />
        <meta property="og:description" content={`Interactive Game Maps and Guides for Cyberpunk 2077 Phantom Liberty, Diablo 4, WoW Classic, and more to come!`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`https://atlasforge.gg/images/cover.jpg`} />
        <meta property="og:site_name" content="ATLAS FORGE" />

        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />

        <link rel="shortcut icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <AppContextProvider>
        <Toaster position="top-center" />

        <main id='main' className={styles.main} style={{ paddingBottom: (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android') ? '50px' : '0' }}>
          <Component {...pageProps} suppressHydrationWarning />
          {isIframe && <a className={styles.watermark} href={document.location.href || 'https://atlasforge.gg'} target="_blank">ATLASFORGE.GG</a>}
          <div id='tooltip-container' className={styles.tooltipContainer} />
        </main>

        {Capacitor.getPlatform() === 'web' && !isIframe && !pathname?.includes('map') && !pathname?.includes('skilltree') && <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.copyrightSection} id='copyright-nav-section'>
              <p>ATLASFORGE.gg is not affiliated with CD Projekt S.A.</p>
              <p>© ATLAS FORGE LLC {new Date().getFullYear()}</p>
              <span data-ccpa-link="1"></span>
            </div>
            <div className={styles.links}>
              <h3>LINKS</h3>
              <a href="mailto:contact@atlasforge.gg" target="_blank" rel="noopener noreferrer">Contact</a>
              <a href="/privacy" target="_blank">Privacy Policy</a>
              <a href="https://worldofwarcraft.blizzard.com/" target="_blank">Official Site</a>


            </div>
          </div>
        </footer>}
        <NavBar currentgame={'wow-classic'} suppressHydrationWarning />
      </AppContextProvider>
    </>
  )
}
