import React from 'react'
import styles from './Popup.module.css'
import { AiFillSave, AiFillEdit } from "react-icons/ai";
import { IoMdClose } from "react-icons/io";
import { MdEdit } from 'react-icons/md'

const QuestDisplay = ({ marker }) => {


  return (

    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.column}>
          {marker?.title && <p className={styles.title}>{marker?.title}</p>}
          <p className={styles.label}>{marker?.label ?? marker?.type}</p>
        </div>
      </div>
      {marker?.description && <p className={styles.description}>{marker?.description}</p>}
    </div>
  )
}

export default QuestDisplay;