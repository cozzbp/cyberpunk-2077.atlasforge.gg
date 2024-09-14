import React from 'react'
import styles from './Popup.module.css'
import { AiFillSave, AiFillEdit } from 'react-icons/ai'
import { IoMdClose, IoMdCode, IoMdLink } from 'react-icons/io'
import { IoCodeSlash } from 'react-icons/io5'
import { MdEdit, MdShare, MdOutlineCodeOff } from 'react-icons/md'
import { MAP_LABELS } from '@/data/mapdefinitions'
import { Clipboard } from '@capacitor/clipboard'
import toast from 'react-hot-toast'

const Popup = ({ marker, edit, types, onSaveMarker, onCancel, found, onSetFound }) => {
  const nameInputRef = React.useRef(null)
  const typeRef = React.useRef(null)
  const descInputRef = React.useRef(null)
  const [doEdit, setDoEdit] = React.useState(edit)

  console.log('onsetfound', onSetFound)

  const share = async () => {
    const Host = 'https://atlasforge.gg/cyberpunk-2077'
    const value = `${Host}/map?marker=${encodeURIComponent(marker.id)}`
    if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
      /* await Share.share({
          title: 'D4Planner.io Map Link',
          text: 'Check out this Diablo IV Map Location',
          url: value,
          diaglogTitle: 'Share Diablo IV Map Location',
      }) */
      await Clipboard.write({
        string: value
      });
      toast.success('Link copied to clipboard')
    } else {
      await Clipboard.write({
        string: value
      });
      toast.success('Link copied to clipboard')
    }
  }
  const embed = async () => {
    const Host = 'https://atlasforge.gg/cyberpunk-2077'
    const value = `${Host}/map?marker=${encodeURIComponent(marker.id)}`
    const code = `<iframe width="500" height="500" src="${value}" title="AtlasForge.gg Cyberpunk 2077 Map Location" frameborder="0"></iframe>`

    await Clipboard.write({
      string: code
    });

    toast.success('Embed code copied to clipboard')
  }

  return (
    <div className={styles.container}>
      {doEdit ?
        <div>
          <div className={styles.inputContainer}>
            <input className={styles.input} type='text' ref={nameInputRef} placeholder={'Title'} defaultValue={marker?.title} />
          </div>

          <div className={styles.inputContainer}>
            <select className={styles.input} ref={typeRef} defaultValue={marker?.type}>
              {types.map((type) => <option key={type} value={type}>{MAP_LABELS[type] || type}</option>)}
            </select>
          </div>
          <div className={styles.inputContainer}>
            <textarea className={`${styles.input} ${styles.textarea}`} ref={descInputRef} placeholder={'Description'} defaultValue={marker?.description} />
          </div>
          <div className={styles.saveControls}>
            <div onClick={onCancel} className={styles.saveButton}><IoMdClose size={25} /></div>
            <div onClick={() => onSaveMarker({ ...marker, type: typeRef.current.value, name: nameInputRef.current.value, description: descInputRef.current.value })} className={styles.saveButton}><AiFillSave size={25} /></div>
          </div>
        </div>
        :
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.column}>
              {marker?.title && <p className={styles.title}>{marker?.title}</p>}
              <p className={styles.label}>{marker?.label ?? marker?.type}</p>
            </div>
            <div className={styles.headerButtons}>
              <div onClick={() => setDoEdit(true)} className={styles.saveButton}><MdEdit size={25} /></div>
              <div onClick={() => share()} className={styles.saveButton}><IoMdLink size={25} /></div>
              <div onClick={() => embed()} className={styles.saveButton}><IoCodeSlash size={25} /></div>
            </div>
          </div>
          {marker?.description && <p className={styles.description}>{marker?.description}</p>}
          <div className={styles.found}>
            <p>FOUND</p>
            <input className={styles.checkbox} type='checkbox' defaultChecked={found} onChange={(e) => onSetFound(e.target.checked)}/>
          </div>
        </div>
      }
    </div>
  )
}

export default Popup;