import {
  setHowMuch,
  setName,
  setWhere,
  setWho
} from "./store/actions"
import {
  useActivityEditorDispatch,
  useActivityEditorSelector
} from "./store/store"

export const ActivityEditorForm = () => {
  const editorDispatch = useActivityEditorDispatch()
  const name = useActivityEditorSelector(s => s.formData.name)
  const who = useActivityEditorSelector(s => s.formData.who)
  const where = useActivityEditorSelector(s => s.formData.where)
  const howMuch = useActivityEditorSelector(s => s.formData.howMuch)

  const hasDetail = useActivityEditorSelector(es => es.hasDetail)
  const isNew = useActivityEditorSelector(es => es.id === undefined)
  const isEdit = useActivityEditorSelector(es => es.isEdit)
  const initialized = useActivityEditorSelector(es => es.initialized)

  const disabled = !isNew && (!isEdit || !initialized)
  return (
    <form onSubmit={() => { }} >
      <fieldset disabled={disabled} >
        <label htmlFor="name">name:</label><br />
        <input type="text" id="name" value={name} onChange={e => { editorDispatch(setName(e.target.value ?? '')) }} /><br />

        {(isNew || hasDetail) &&
          <>
            <label htmlFor="who">who:</label><br />
            <input type="text" id="who" value={who} onChange={e => { editorDispatch(setWho(e.target.value ?? '')) }} /><br />

            <label htmlFor="where">where:</label><br />
            <input type="text" id="where" value={where} onChange={e => { editorDispatch(setWhere(e.target.value ?? '')) }} /><br />

            <label htmlFor="how-much">how much:</label><br />
            <input
              type="number"
              id="how-much"
              value={howMuch ?? ''}
              onChange={e => {
                const intValue = parseInt(e.target.value)
                const finalValue = isNaN(intValue) ? undefined : intValue
                editorDispatch(setHowMuch(finalValue))
              }}
            />
            <br />
          </>
        }
      </fieldset>
    </form>
  )
}