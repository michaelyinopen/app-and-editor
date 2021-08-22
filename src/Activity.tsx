// replace by ActivityEditor
type ActivityProp = {
  id: number | undefined, // undefined for new job set 
  edit: boolean
}

export const Activity = ({
  id,
  edit
}: ActivityProp) => {
  return (
    <div>
      Id: {id}<br />
      Edit: {edit.toString()}
    </div>
  )
}