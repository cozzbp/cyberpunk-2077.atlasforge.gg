'use client'
import styles from './NavBar.module.css'
import React, { useState, useEffect, Suspense, createContext, useContext } from 'react'
import glitch from '@/styles/glitch.module.css'
import { Capacitor } from '@capacitor/core'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Discord from "@/components/icons/Discord";
import toast, { Toaster } from 'react-hot-toast';
import { AppContext, checkLogin } from '@/context/AppContext'
import { RiCloseCircleLine } from "react-icons/ri";
import { App } from '@capacitor/app'
import { PushNotifications } from '@capacitor/push-notifications'
import { Preferences } from '@capacitor/preferences'
import { LINK_PREFIX } from '@/asset_prefix'

import * as _ from 'lodash'

const NavBar = ({ children, style, currentgame }) => {

  const [state, dispatch] = React.useContext(AppContext)
  const [lastlocation, setLastLocation] = useState()
  const [ads, setAds] = useState([])
  const [trackersOpen, setTrackersOpen] = useState()
  const [databaseOpen, setDatabaseOpen] = useState()
  const [tierListsOpen, setTierListsOpen] = useState()
  const router = useRouter()
  const location = typeof window !== 'undefined' ? window.location.pathname : ''

  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const isIframe = typeof window !== 'undefined' && window.self !== window.top
  /* if (isIframe) return <></> */

  useEffect(() => {
    const getLoginInfo = async () => {
      let result = await checkLogin()
      dispatch({
        type: "RECEIVE_LOGIN",
        payload: result
      })
    }
    getLoginInfo()
  }, []);

  //INIT NITRO ADS
  useEffect(() => {

    const initializeNitro = async () => {


      console.log('state', state)
      if (state?.is_loading) return

      setLastLocation(location?.pathname)

      document.querySelectorAll('.article-content-auto').forEach(e => e.remove());
      ads.forEach(ad => {
        document.querySelectorAll(`[id=${ad?.id}]`).forEach(element => element?.remove())
        //document.getElementById(ad?.id)?.remove();
      })

      if (!state?.is_premium && Capacitor.getPlatform() === 'web' && window === window.parent) {
        let newAds = _.cloneDeep(ads)

        newAds.push(await window['nitroAds'].createAd('cyberpunk-sticky-rail-right', {
          "demo": process.env.NODE_ENV === 'development',
          "refreshLimit": 0,
          "refreshTime": 30,
          "format": "rail",
          "rail": "right",
          "railOffsetTop": 0,
          "railOffsetBottom": 0,
          "railCollisionWhitelist": ["*"],
          "sizes": [
            [
              "160",
              "600"
            ]
          ],
          "report": {
            "enabled": true,
            "icon": true,
            "wording": "Report Ad",
            "position": "top-left"
          },
          "mediaQuery": '(min-width: 1400px)'
        }))

        if (!pathname?.includes('map')) {
          newAds.push(await window['nitroAds'].createAd('cyberpunk-sticky-rail-left', {
            "demo": process.env.NODE_ENV === 'development',
            "refreshLimit": 0,
            "refreshTime": 30,
            "format": "rail",
            "rail": "left",
            "railOffsetTop": 0,
            "railOffsetBottom": 0,
            "railCollisionWhitelist": ["*"],
            "sizes": [
              [
                "160",
                "600"
              ]
            ],
            "report": {
              "enabled": true,
              "icon": true,
              "wording": "Report Ad",
              "position": "top-right"
            },
            "mediaQuery": '(min-width: 992px)'
          }))
        }

        newAds.push(await window['nitroAds'].createAd('cyberpunk-root-anchor', {
          "demo": process.env.NODE_ENV === 'development',
          "refreshLimit": 0,
          "refreshTime": 30,
          "format": "anchor",
          "anchor": "bottom",
          "anchorPersistClose": true,
          "anchorBgColor": "rgba(0,0,0,0.8)",
          "report": {
            "enabled": true,
            "icon": true,
            "wording": "Report Ad",
            "position": "top-right"
          },
          "mediaQuery": "(min-width: 320px)"
        }))
        newAds.push(await window['nitroAds'].createAd('cyberpunk-root-outstream', {
          "demo": process.env.NODE_ENV === 'development',
          "refreshLimit": 0,
          "refreshTime": 30,
          "format": "floating",
          "report": {
            "enabled": true,
            "icon": true,
            "wording": "Report Ad",
            "position": "top-right"
          },
          "mediaQuery": "(min-width: 1025px)"
        }))
        setAds(newAds)
      }
    }
    initializeNitro()
  }, [location, state?.is_premium, state?.is_loading])

  const AppUrlListener = () => {

    useEffect(() => {
      App.addListener('appUrlOpen', (event) => {
        // Example url: https://beerswift.app/tabs/tab2
        // slug = /tabs/tab2
        const slug = event.url.split('.io').pop();
        if (slug) {
          router.push(slug)
        }
        // If no match, do nothing - let regular routing
        // logic take over
      });

      //PUSH NOTIFICATIONS
      if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        console.log('Notification permission granted.')
        PushNotifications.register()
        PushNotifications.addListener('registration',
          async (token) => {
            //alert('Push registration success, token: ' + token.value);
            await Preferences.set({
              key: `fcm_token`,
              value: token.value,
            })
          }
        );

        // Some issue with our setup and push will not work
        PushNotifications.addListener('registrationError',
          (error) => {
            toast.error(JSON.stringify(error))
          }
        );

        // Method called when tapping on a notification
        PushNotifications.addListener('pushNotificationActionPerformed',
          (notification) => {
            router.push('/map');
          }
        );
        PushNotifications.addListener('pushNotificationReceived',
          (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
            toast.success(notification?.title)
          }
        );
      }
    }, []);

    return null;
  };

  const resizeHandler = () => {
    if (window.innerWidth > 750) {
      setTrackersOpen(true)
      setDatabaseOpen(true)
      setTierListsOpen(true)
    } else {
      if ((pathname?.includes('items') || pathname?.includes('aspects') || pathname?.includes('skills'))) setDatabaseOpen(true)
      else setDatabaseOpen(undefined)

      if (pathname?.includes('trackers')) setTrackersOpen(true)
      else setTrackersOpen(undefined)

      if (pathname?.includes('tierlists')) setTierListsOpen(true)
      else setTierListsOpen(undefined)
    }
  }

  React.useEffect(() => {
    resizeHandler()
    window.addEventListener('resize', resizeHandler, true)
    return () => {
      window.removeEventListener('resize', resizeHandler, true)
    }
  }, [])


  return (
    <>
      <AppUrlListener></AppUrlListener>
      <nav className={styles.navContainer} style={style}>
        <div className={styles.navBar}>
          <Link href={`/`}><h1 className={`${styles.headerLogo} ${glitch.glitch} ${glitch.layers}`} data-text={'ATLASFORGE.GG'}>ATLASFORGE.GG</h1></Link>

          <div className={styles.navLinks} data-open={menuOpen}>
            <Link onClick={() => setMenuOpen(false)} className={styles.styledLink} href={`/map`}>MAP</Link>
            <div></div>

          </div>

          <div className={styles.buttonContainer}>
            <a className={styles.discordLink} href="https://discord.gg/duAfUu45Wk" target="_blank"><Discord /></a>
            {Capacitor.getPlatform() === 'web' && <a className={styles.supportLink} href="/support"><RiCloseCircleLine /> AD-FREE</a>}
            <div className={styles.hamburgerButton} onClick={() => setMenuOpen(!menuOpen)}>
              <div className={`${styles.hamburgerLine} ${styles.hamburgerLineTop} ${menuOpen && styles.hamburgerLineTopOpen}`} />
              <div className={`${styles.hamburgerLine} ${styles.hamburgerLineMiddle} ${menuOpen && styles.hamburgerLineMiddleOpen}`} />
              <div className={`${styles.hamburgerLine} ${styles.hamburgerLineBottom} ${menuOpen && styles.hamburgerLineBottomOpen}`} />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}


export default NavBar