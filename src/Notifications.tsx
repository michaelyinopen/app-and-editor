import { useAppDispatch, useAppSelector } from "./store"
import { addNotification, clearNotifications } from "./store/actions"
import styles from './Notifications.module.css';

export const Notifications = () => {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(state => state.notifications)
  return (
    <details style={{ position: 'fixed', bottom: 0, borderStyle: 'ridge', display: 'block', backgroundColor: 'white' }}>
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
      <button
        onClick={() => { dispatch(addNotification("a notification")) }}
      >
        add notification
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
            className={styles.notificationItem}
          >
            {index + 1}. {n}
          </div>
        )).reverse()}
      </div>
    </details>
  )
}