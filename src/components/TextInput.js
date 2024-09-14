import React from 'react'
import styles from './TextInput.module.css'
import { IoMdClose } from "react-icons/io";
import * as _ from 'lodash'

const TextInput = (props) => {
  const inputRef = React.useRef(null)

  const clearInput = (event) => {
    inputRef.current.value = ''
    props?.onInputChanged('')
  }

  return (
    <div className={`${styles.inputContainer} ${props?.className}`}>
      {props.icon && <div className={styles.icon}>{props.icon}</div>}
      <input {..._.omit(props, 'onInputChanged')} className={styles.input} type='text' ref={inputRef} onChange={props?.onInputChanged}/>
      <div className={styles.icon} onClick={clearInput}><IoMdClose className={styles.clearIcon}/></div>
    </div>

  )
}

export default TextInput;