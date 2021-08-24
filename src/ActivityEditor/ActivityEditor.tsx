import {
  ComponentType,
  FunctionComponent,
  useEffect,
} from "react"
import { Link } from 'react-router-dom'
import {
  createSingleActivityIsLoadingSelector,
  getActivityTakingThunkAction
} from "../getActivityTakingThunkAction"
import { useAppDispatch, useAppSelector } from "../store"
import {
  failedToLoadActivity,
  loadedActivity,
  resetActivityEditor,
  setActivityEditorId,
  setActivityEditorIsEdit,
  setActivityFromAppStore,
} from "./store/actions"
import {
  ActivityEditorProvider,
  useActivityEditorDispatch,
  useActivityEditorSelector
} from "./store/store"
import { ActivityEditorForm } from './ActivityEditorForm'

type ActivityEditorProps = {
  id: number | undefined
  edit: boolean
}

type WithActivityEditorProviderType =
  (Component: ComponentType<ActivityEditorProps>) => FunctionComponent<ActivityEditorProps>

const WithJobSetEditorProvider: WithActivityEditorProviderType = (Component) => (props) => {
  return (
    <ActivityEditorProvider>
      <Component {...props} />
    </ActivityEditorProvider>
  )
}

export const ActivityEditor: FunctionComponent<ActivityEditorProps> = WithJobSetEditorProvider(
  ({ id, edit }) => {
    const dispatch = useAppDispatch()
    const editorDispatch = useActivityEditorDispatch()

    useEffect(() => {
      editorDispatch(setActivityEditorId(id))
      return () => { editorDispatch(resetActivityEditor()) }
    }, [editorDispatch, id])

    useEffect(() => {
      editorDispatch(setActivityEditorIsEdit(edit))
    }, [editorDispatch, edit])

    useEffect(() => {
      if (id) {
        dispatch(getActivityTakingThunkAction(id))
          .then(result => {
            if (result === true) {
              editorDispatch(loadedActivity())
            } else {
              editorDispatch(failedToLoadActivity())
            }
          })
          .catch(() => {
            editorDispatch(failedToLoadActivity())
          })
      }
    }, [dispatch, editorDispatch, id])

    const appActivity = useAppSelector(s => id !== undefined ? s.activities.entities[id] : undefined)

    const loadStatus = useActivityEditorSelector(es => es.loadStatus)
    const initialized = useActivityEditorSelector(es => es.initialized)
    const thunkLoading = useAppSelector(createSingleActivityIsLoadingSelector(id))

    useEffect(() => {
      editorDispatch(setActivityFromAppStore(appActivity, loadStatus === 'loaded'))
    }, [editorDispatch, appActivity, loadStatus])

    const showLoading = thunkLoading || (!initialized && loadStatus !== 'failed')

    return (
      <div>
        {id ? <h1>Activity #{id}</h1> : <h1>New Activity</h1>}
        <div>
          <button
            onClick={() => {
              if (id) {
                dispatch(getActivityTakingThunkAction(id))
                  .then(result => {
                    if (result === true) {
                      editorDispatch(loadedActivity())
                    }
                  })
              }
            }}
          >
            referesh
          </button>
          {loadStatus === 'failed' && <span> Please try again.</span>}
          {showLoading && <span> Loading...</span>}
        </div>
        {edit
          ? <Link to={`/activities/${id}`}>readonly</Link>
          : <Link to={`/activities/${id}/edit`}>edit</Link>
        }
        <ActivityEditorForm disabled={!edit || !initialized} />
      </div>
    )
  }
)
