import { setHowMuch, setName, setWhere, setWho } from "./store/actions"
import { useActivityEditorDispatch, useActivityEditorSelector } from "./store/store"


export const ActivityEditorForm = ({ disabled }) => {
  const editorDispatch = useActivityEditorDispatch()
  const name = useActivityEditorSelector(s => s.formData.name)
  const who = useActivityEditorSelector(s => s.formData.who)
  const where = useActivityEditorSelector(s => s.formData.where)
  const howMuch = useActivityEditorSelector(s => s.formData.howMuch)

  const failedToLoad = useActivityEditorSelector(es => es.loadStatus) === 'failed'
  const setFromAppStore = useActivityEditorSelector(es => es.initialized)
  return (
    <form onSubmit={() => { }}>
      <fieldset disabled={disabled} >
        <label htmlFor="name">name:</label><br />
        <input type="text" id="name" value={name} onChange={e => { editorDispatch(setName(e.target.value ?? '')) }} /><br />

        {setFromAppStore && !failedToLoad &&
          <>
            <label htmlFor="who">who:</label><br />
            <input type="text" id="who" value={who} onChange={e => { editorDispatch(setWho(e.target.value ?? '')) }} /><br />

            <label htmlFor="where">where:</label><br />
            <input type="text" id="where" value={where} onChange={e => { editorDispatch(setWhere(e.target.value ?? '')) }} /><br />

            <label htmlFor="how-much">how much:</label><br />
            <input type="number" id="how-much" value={howMuch} onChange={e => { editorDispatch(setHowMuch(+e.target.value ?? undefined)) }} /><br />
          </>
        }
      </fieldset>
      {/* 
      <fieldset {...(disabled ? { disabled: true } : {})}>
        <input type="Submit">Save</input>
      </fieldset>
      */}
    </form>
  )
}