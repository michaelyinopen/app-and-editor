import {
  ComponentType,
  FunctionComponent,
  useEffect,
  useState,
} from "react"
import { nanoid } from 'nanoid'
import { Link, useHistory, Prompt } from 'react-router-dom'
import {
  useAppDispatch,
  useAppSelector,
  addNotification
} from "../store"
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
import {
  createSingleActivityIsLoadingSelector,
  getActivityTakingThunkAction
} from "../takingThunkActions/getActivityTakingThunkAction"
import {
  createUpdateActivityIsLoadingSelector,
  updateActivityTakingThunkAction
} from "../takingThunkActions/updateActivityTakingThunkAction"
import {
  createActivityIsDeletingSelector,
  deleteActivityTakingThunkAction
} from "../takingThunkActions/deleteActivityTakingThunkAction"
import {
  createActivityTakingThunkAction,
  createCreateActivityIsLoadingSelector
} from '../takingThunkActions/createActivityTakingThunkAction'
import { PrintSteps } from "./PrintSteps"

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

const ExitPrompt = () => {
  const isEdit = useActivityEditorSelector(es => es.isEdit)
  const isNew = useActivityEditorSelector(es => es.id === undefined)
  const isInitialStep = useActivityEditorSelector(es => es.steps.length === 1)
  const isCurrentStepSaved = useActivityEditorSelector(es => es.steps[es.currentStepIndex].saveStatus === 'saved')
  const condition = isEdit
    && !isCurrentStepSaved
    && (isNew || !isInitialStep) // deep equal with previous version?
  return (
    <Prompt
      when={condition}
      message={'Exit without saving?\nAll changes will be lost.'}
    />
  )
}

const Refresh = () => {
  const id = useActivityEditorSelector(es => es.id)
  const loadStatus = useActivityEditorSelector(es => es.loadStatus)
  const initialized = useActivityEditorSelector(es => es.initialized)

  const thunkLoading = useAppSelector(createSingleActivityIsLoadingSelector(id))

  const dispatch = useAppDispatch()
  const editorDispatch = useActivityEditorDispatch()

  const showLoading = thunkLoading || (!initialized && loadStatus !== 'failed')

  if (!id) {
    return null
  }
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: 50 }}>
        <button
          onClick={() => {
            if (id) {
              dispatch(getActivityTakingThunkAction(id))
                .then(result => {
                  if (result === true) {
                    editorDispatch(loadedActivity())
                  }
                  else if (result === false) {
                    dispatch(addNotification(`Failed to get Activity #${id}`))
                  }
                })
                .catch(() => {
                  dispatch(addNotification(`Failed to get Activity #${id}`))
                })
            }
          }}
        >
          Referesh
        </button>
        {showLoading && <span>Loading...</span>}
      </div>
      {loadStatus === 'failed' && <span>Please try again.</span>}
    </>
  )
}

const Save = () => {
  const id = useActivityEditorSelector(es => es.id)
  const isEdit = useActivityEditorSelector(es => es.isEdit)
  const loadStatus = useActivityEditorSelector(es => es.loadStatus)
  const initialized = useActivityEditorSelector(es => es.initialized)

  const formData = useActivityEditorSelector(es => es.formData)
  const versionToken = useActivityEditorSelector(es => es.versions[es.versions.length - 1]?.versionToken)
  const currentStepIndex = useActivityEditorSelector(es => es.currentStepIndex)

  const isDeleting = useAppSelector(createActivityIsDeletingSelector(id))
  const isSaving = useAppSelector(createUpdateActivityIsLoadingSelector(id))

  const dispatch = useAppDispatch()
  const editorDispatch = useActivityEditorDispatch()

  const disabled = isDeleting || !isEdit || !initialized || loadStatus === 'failed'
  if (!id) {
    return null
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 50 }}>
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
            cost: formData.howMuch!,
            rides: formData.rides.ids.map((rid, index) => ({
              id: rid,
              description: formData.rides.entities[rid].description,
              sequence: index + 1
            })),
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
      {isSaving && <span>Saving...</span>}
    </div>
  )
}

const Create = () => {
  const history = useHistory()
  const isNew = useActivityEditorSelector(es => es.id === undefined)
  const [creationToken, setCreationToken] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (isNew) {
      setCreationToken(nanoid())
    }
    return () => setCreationToken(undefined)
  }, [isNew])

  const formData = useActivityEditorSelector(es => es.formData)
  const currentStepIndex = useActivityEditorSelector(es => es.currentStepIndex)

  const isCreating = useAppSelector(createCreateActivityIsLoadingSelector(creationToken))

  const dispatch = useAppDispatch()
  const editorDispatch = useActivityEditorDispatch()

  if (!isNew) {
    return null
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 50 }}>
      <button
        disabled={isCreating}
        onClick={() => {
          const activity = {
            name: formData.name,
            person: formData.who,
            place: formData.where,
            cost: formData.howMuch!,
            rides: formData.rides.ids.map((rid, index) => ({
              id: rid,
              description: formData.rides.entities[rid].description,
              sequence: index + 1
            })),
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
      {isCreating && <span>Creating...</span>}
    </div >
  )
}

const Delete = () => {
  const history = useHistory()
  const id = useActivityEditorSelector(es => es.id)

  const isDeleting = useAppSelector(createActivityIsDeletingSelector(id))

  const dispatch = useAppDispatch()

  if (!id) {
    return null
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 50 }}>
      <button
        onClick={() => {
          dispatch(deleteActivityTakingThunkAction(id!))
            .then(result => {
              if (result === true) {
                dispatch(addNotification(`Deleted Activity #${id}`))
                history.push('/activities')
              }
              if (result === false) {
                dispatch(addNotification(`Failed to deleted Activity #${id}`))
              }
            })
            .catch(() => {
              dispatch(addNotification(`Failed to deleted Activity #${id}`))
            })
        }}
      >
        Delete
      </button>
      {isDeleting && <span> Deleting...</span>}
    </div>
  )
}

export const ActivityEditor: FunctionComponent<ActivityEditorProps> = WithJobSetEditorProvider(
  ({ id, edit }) => {
    const isNew = id === undefined
    const dispatch = useAppDispatch()
    const editorDispatch = useActivityEditorDispatch()

    useEffect(() => {
      editorDispatch(setActivityEditorId(id))
      return () => {
        if (!isNew) { // does not reset if change from new to an activity with id
          editorDispatch(resetActivityEditor())
        }
      }
    }, [editorDispatch, id, isNew])

    useEffect(() => {
      editorDispatch(setActivityEditorIsEdit(edit))
    }, [editorDispatch, edit])

    const loadStatus = useActivityEditorSelector(es => es.loadStatus)
    const isLoaded = loadStatus === 'loaded'

    useEffect(() => {
      if (!isNew && id && !isLoaded) {
        dispatch(getActivityTakingThunkAction(id))
          .then(result => {
            if (result === true) {
              editorDispatch(loadedActivity())
            }
            else if (result === false) {
              dispatch(addNotification(`Failed to get Activity #${id}`))
              editorDispatch(failedToLoadActivity())
            }
          })
          .catch(() => {
            dispatch(addNotification(`Failed to get Activity #${id}`))
          })
      }
    }, [dispatch, editorDispatch, isNew, id, isLoaded])

    const appActivity = useAppSelector(s => id !== undefined ? s.activities.entities[id] : undefined)

    useEffect(() => {
      if (!isNew) {
        editorDispatch(setActivityFromAppStore(appActivity as ActivityFromStore, loadStatus === 'loaded'))
      }
    }, [editorDispatch, appActivity, loadStatus, isNew])

    return (
      <div>
        <ExitPrompt />
        {id ? <h1>Activity #{id}</h1> : <h1>New Activity</h1>}
        <div style={{ display: 'flex', flexDirection: 'row', columnGap: 8 }}>
          <Refresh />
          <Save />
          <Create />
          <Delete />
        </div>
        {!isNew && (
          edit
            ? <Link to={`/activities/${id}`}>readonly</Link>
            : <Link to={`/activities/${id}/edit`}>edit</Link>
        )}
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <ActivityEditorForm />
          {edit && <EditHistory />}
          {edit && <PrintSteps />}
        </div>
      </div>
    )
  }
)
