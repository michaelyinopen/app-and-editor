import {
  useAppDispatch,
  useAppSelector,
  clearNotifications,
} from "./store"
import styles from './Notifications.module.css';

export const Notifications = () => {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(state => state.notifications)
  return (
    <details open style={{ position: 'fixed', bottom: 0, borderStyle: 'ridge', display: 'block', backgroundColor: 'white' }}>
      <summary>
        <span style={{ userSelect: 'none', fontSize: '1.2rem' }}>
          Notifications ({notifications.length})
        </span>
      </summary>
      <button
        onClick={() => { dispatch(clearNotifications()) }}
      >
        clear
      </button>
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateRows: 'repeat(10, auto)',
        }}
      >
        {notifications.map((n, index) => (
          <div
            key={index}
            className={styles.notificationItem}
          >
            {index + 1}. {n}
          </div>
        )).reverse()}
      </div>
    </details>
  )
}