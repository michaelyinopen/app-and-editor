import {
  ComponentType,
  FunctionComponent,
  useEffect,
  useState,
} from "react"
import { nanoid } from 'nanoid'
import { Link, useHistory } from 'react-router-dom'
import {
  createSingleActivityIsLoadingSelector,
  getActivityTakingThunkAction
} from "../getActivityTakingThunkAction"
import { useAppDispatch, useAppSelector } from "../store"
import {
  ActivityFromStore,
  failedToLoadActivity,
  loadedActivity,
  resetActivityEditor,
  savedStep,
  savingStep,
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
import { EditHistory } from "./EditHistory"
import { updateActivityTakingThunkAction } from "../updateActivityTakingThunkAction"
import { createActivityIsDeletingSelector, deleteActivityTakingThunkAction } from "../deleteActivityTakingThunkAction"
import { createActivityTakingThunkAction, createCreateActivityIsLoadingSelector } from '../createActivityTakingThunkAction'
import { addNotification } from "../store/actions"

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
      return () => {
        if (id) {
          editorDispatch(resetActivityEditor())
        }
      }
    }, [editorDispatch, id])

    useEffect(() => {
      editorDispatch(setActivityEditorIsEdit(edit))
    }, [editorDispatch, edit])

    const [creationToken, setCreationToken] = useState<string | undefined>(undefined)
    useEffect(() => {
      if (!id) {
        setCreationToken(nanoid())
      }
      return () => setCreationToken(undefined)
    }, [id])

    const loadStatus = useActivityEditorSelector(es => es.loadStatus)
    const isLoaded = loadStatus === 'loaded'

    useEffect(() => {
      if (!isNew && id && !isLoaded) {
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
    }, [dispatch, editorDispatch, isNew, id, isLoaded])

    const appActivity = useAppSelector(s => id !== undefined ? s.activities.entities[id] : undefined)

    const initialized = useActivityEditorSelector(es => es.initialized)
    const thunkLoading = useAppSelector(createSingleActivityIsLoadingSelector(id))
    const isCreating = useAppSelector(createCreateActivityIsLoadingSelector(creationToken))

    const steps = useActivityEditorSelector(es => es.steps) //todo remove
    const currentStepIndex = useActivityEditorSelector(es => es.currentStepIndex)

    useEffect(() => {
      if (!isNew) {
        editorDispatch(setActivityFromAppStore(appActivity as ActivityFromStore, loadStatus === 'loaded'))
      }
    }, [editorDispatch, appActivity, loadStatus, isNew])

    const isDeleting = useAppSelector(createActivityIsDeletingSelector(id))
    const showLoading = thunkLoading || (!initialized && loadStatus !== 'failed')
    const disabled = !isNew && (isDeleting || !edit || !initialized || loadStatus === 'failed')

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
              Referesh
            </button>
          )}
          {' '}
          {!isNew && (
            <button
              disabled={disabled}
              onClick={() => {
                if (!id) {
                  return
                }
                const activity = {
                  id,
                  name: formData.name,
                  person: formData.who,
                  place: formData.where,
                  cost: formData.howMuch,
                  versionToken,
                }
                editorDispatch(savingStep(currentStepIndex, true))
                dispatch(updateActivityTakingThunkAction(id, activity))
                  .then(result => {
                    if (result === 'success') {
                      dispatch(addNotification(`Saved Activity #${id}`))
                      editorDispatch(savedStep(currentStepIndex))
                      return
                    }
                    else if (result === 'version condition failed') {
                      dispatch(addNotification(`Activity #${id} was updated by another user, check the merged changes and save again`))
                    }
                    else if (result === 'not found') {
                      dispatch(addNotification(`Activity #${id} was deleted and cannot be saved`))
                    }
                    else if (result === 'failed') {
                      dispatch(addNotification(`Failed to saved Activity #${id}`))
                    }
                    editorDispatch(savingStep(currentStepIndex, false))
                  })
                  .catch(() => {
                    dispatch(addNotification(`Failed to saved Activity #${id}`))
                    editorDispatch(savingStep(currentStepIndex, false))
                  })
              }
              }
            >
              Save
            </button>
          )}
          {isNew && (
            <button
              disabled={isCreating}
              onClick={() => {
                const activity = {
                  name: formData.name,
                  person: formData.who,
                  place: formData.where,
                  cost: formData.howMuch,
                }
                editorDispatch(savingStep(currentStepIndex, true))
                dispatch(createActivityTakingThunkAction(activity, creationToken))
                  .then(result => {
                    if (result[0] === true) {
                      const createdActivity = result[1]
                      const createdId = createdActivity.id
                      dispatch(addNotification(`Created Activity #${createdId}`))
                      editorDispatch(loadedActivity())
                      editorDispatch(savedStep(currentStepIndex))
                      history.push(`/activities/${createdId}/edit`)
                    }
                    else {
                      dispatch(addNotification('Failed to create Activity'))
                      editorDispatch(savingStep(currentStepIndex, false))
                    }
                  })
                  .catch(() => {
                    dispatch(addNotification('Failed to create Activity'))
                    editorDispatch(savingStep(currentStepIndex, false))
                  })
              }
              }
            >
              Create
            </button>
          )}
          {isNew && isCreating && <span> Creating...</span>}
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
          <ActivityEditorForm disabled={!isNew && (!edit || !initialized)} />
          <EditHistory />
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(steps, null, 2)}</pre>{/*todo remove */}
        </div>
      </div>
    )
  }
)
