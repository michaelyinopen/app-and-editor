import {
  ComponentType,
  FunctionComponent,
  useEffect,
} from "react"
import { Link, useHistory } from 'react-router-dom'
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
import { UndoHistory } from "./UndoHistory"
import { updateActivityTakingThunkAction } from "../updateActivityTakingThunkAction"
import { createActivityIsDeletingSelector, deleteActivityTakingThunkAction } from "../deleteActivityTakingThunkAction"

type ActivityEditorProps = {
  id: number | undefined
  edit: boolean
}

type WithActivityEditorProviderType =
  (Component: ComponentType<ActivityEditorProps>) => FunctionComponent<ActivityEditorProps>

const WithJobSetEditorProvider: WithActivityEditorProviderType = (Component) => (props) => {
  return (
    <ActivityEditorProvider>
      <Component key={props.id} {...props} />
    </ActivityEditorProvider>
  )
}

export const ActivityEditor: FunctionComponent<ActivityEditorProps> = WithJobSetEditorProvider(
  ({ id, edit }) => {
    const isNew = id === undefined
    const dispatch = useAppDispatch()
    const editorDispatch = useActivityEditorDispatch()
    const history = useHistory()

    useEffect(() => {
      editorDispatch(setActivityEditorId(id))
      return () => { editorDispatch(resetActivityEditor()) }
    }, [editorDispatch, id])

    useEffect(() => {
      editorDispatch(setActivityEditorIsEdit(edit))
    }, [editorDispatch, edit])

    useEffect(() => {
      if (!isNew && id) {
        dispatch(getActivityTakingThunkAction(id))
          .then(result => {
            if (result === true) {
              editorDispatch(loadedActivity())
            } else {
              // if(result === false){
              //   notification
              // }
              editorDispatch(failedToLoadActivity())
            }
          })
          .catch(() => {
            editorDispatch(failedToLoadActivity())
            //notification
          })
      }
    }, [dispatch, editorDispatch, isNew, id])

    const appActivity = useAppSelector(s => id !== undefined ? s.activities.entities[id] : undefined)

    const loadStatus = useActivityEditorSelector(es => es.loadStatus)
    const initialized = useActivityEditorSelector(es => es.initialized)
    const thunkLoading = useAppSelector(createSingleActivityIsLoadingSelector(id))

    const steps = useActivityEditorSelector(es => es.steps) //todo remove

    useEffect(() => {
      if (!isNew) {
        editorDispatch(setActivityFromAppStore(appActivity, loadStatus === 'loaded'))
      }
    }, [editorDispatch, appActivity, loadStatus, isNew])

    const isDeleting = useAppSelector(createActivityIsDeletingSelector(id))
    const showLoading = thunkLoading || (!initialized && loadStatus !== 'failed')
    const disabled = isDeleting || !edit || !initialized || loadStatus === 'failed'

    const formData = useActivityEditorSelector(es => es.formData)
    const versionToken = useActivityEditorSelector(es => es.versions[es.versions.length - 1]?.versionToken)

    return (
      <div>
        {id ? <h1>Activity #{id}</h1> : <h1>New Activity</h1>}
        <div>
          {!isNew && (
            <button
              onClick={() => {
                if (id) {
                  dispatch(getActivityTakingThunkAction(id))
                    .then(result => {
                      if (result === true) {
                        editorDispatch(loadedActivity())
                      }
                      // else if(result === false){
                      //   notification
                      // }
                    })
                  // .catch(() => {
                  //   //notification
                  // })
                }
              }}
            >
              referesh
            </button>
          )}
          {' '}
          <button
            disabled={disabled}
            onClick={() => {
              if (id) {
                const activity = {
                  id,
                  name: formData.name,
                  person: formData.who,
                  place: formData.where,
                  cost: formData.howMuch,
                  versionToken,
                }
                dispatch(updateActivityTakingThunkAction(id, activity))
                  .then(result => {
                    if (result === 'success') {
                      //todo
                    }
                    else if (result === 'versionConditionFailed') {
                      //todo notification?
                    }
                    else if (result === 'failed') {
                      //   notification
                    }
                  })
                // .catch(() => {
                //   //notification
                // })
              }
            }}
          >
            save
          </button>
          {!isNew && loadStatus === 'failed' && <span> Please try again.</span>}
          {!isNew && showLoading && <span> Loading...</span>}
          {!isNew && (
            <>
              {' '}
              <button
                onClick={() => {
                  dispatch(deleteActivityTakingThunkAction(id!))
                    .then(result => {
                      if (result === true) {
                        //todo notify
                        history.push('/activities')
                      }
                      if (result === false) {
                        //todo notify
                      }
                    })
                    .catch(() => {
                      //todo notify
                    })
                }}
              >
                Delete
              </button>
            </>
          )}
          {isDeleting && <span> Deleting...</span>}
        </div>
        {!isNew && (
          edit
            ? <Link to={`/activities/${id}`}>readonly</Link>
            : <Link to={`/activities/${id}/edit`}>edit</Link>
        )}
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <ActivityEditorForm disabled={!edit || !initialized} />
          <UndoHistory />
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(steps, null, 2)}</pre>{/*todo remove */}
        </div>
      </div>
    )
  }
)
