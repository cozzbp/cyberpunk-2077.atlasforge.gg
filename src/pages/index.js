'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import ReactDOM from 'react-dom/client'
import Head from 'next/head'
import styles from './page.module.css'
import toast from 'react-hot-toast';
import * as _ from 'lodash'

import { ASSET_PREFIX, LINK_PREFIX } from '@/asset_prefix'

export default function CyberpunkHome() {

  return (
    <>
      <Head>
        <title>Cyberpunk 2077 Phantom Liberty Interactive Map, Database, and Guides</title>
        <meta name="description"
          content="Interactive 3D Map, Database, and Guides for Cyberpunk 2077 Phantom Liberty"
          key="desc"
        />
      </Head>
      <main className={styles.main}>
        <img src={`${ASSET_PREFIX}/images/phantom_liberty_logo.webp`} className={styles.headerImg} loading='lazy' alt='CYBERPUNK 2077: PHANTOM LIBERTY' />
        <div className={styles.center}>
          <div className={styles.mapPreview}>
            <a href={`${LINK_PREFIX}/map`}>
              <img src={`${ASSET_PREFIX}/images/map.webp`} />

              <div>
                <h4>CYBERPUNK 2077: PHANTOM LIBERTY INTERACTIVE MAP</h4>
              </div>
            </a>
          </div>
        </div>
      </main>
    </>
  )
}