import styles from './PopupLabel.module.css';

const PopupLabel = ({ marker }) => {
  return (
    <div className={styles.container}>
      <p className={styles.label}>{marker?.title ?? marker?.label ?? marker?.type}</p>
    </div>
  )
}

export default PopupLabel;