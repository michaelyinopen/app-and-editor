import { useAppDispatch, useAppSelector } from "./store"
import { addNotification, clearNotifications } from "./store/actions"

export const Notifications = () => {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(state => state.notifications)
  return (
    <details>
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
      <ol
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'wrap',
          maxHeight: 240,
          alignContent: 'flex-start',
          listStyleType: 'none',
          marginBlockStart: 0,
          marginBlockEnd: 0,
          marginInlineStart: 0,
          marginInlineEnd: 0,
          paddingInlineStart: 0,
        }}
      >
        {notifications.map((n, index) => (
          <li
            key={index}
            style={{
              display: 'block',
              margin: '0 5px',
              borderStyle: 'outset',
              maxWidth: 200
            }}
          >
            {index + 1}. {n}
          </li>
        )).reverse()}
      </ol>
    </details>
  )
}