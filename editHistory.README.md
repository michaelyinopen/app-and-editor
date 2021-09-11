# Edit History

## Version Token
Token for a specific version. If data is saved, version token changes, therefore can detect change by comparing the version tokens.

## Path
Json Pointers-like, starts with `/`. e.g. `/who`.

## Field Change

Records a change of value in path's location.
Can undo and redo each field change.

## Merged Field Change
If the a field's value changes consecutively, it will count as one field change. It is implemented my merging the new change with the last field change. `mergeFieldChanges`

## Step
Related and consecutive field changes will count as one step. One step can have one field change, or multiple field changes. It is implemented my merging the new change with the last step. `calculateSteps`

If step has `VersionToken`, the step is a "Refreshed" step. `mergeBehaviour` can either be `merge` or `discard local changes`.

When `mergeBehaviour` is `merge`, `fieldChanges` and `conflicts` both represents server-side changes merged to the current form data. `fieldChanges` contains fields that are changed only in the server.`conflicts` contains fields that are changed in the server and locally.

When `mergeBehaviour` is `discard local changes`, all `conflicts` are applied and `reverseCurrentFieldChanges` are also applied. The result formData will be the server-side's formData.

`saveStatus` shows that the formData at that step is saved by the user, and that step will not merge with later changes. `saveStatus` is not reliable, and is intended only for giving the user a hint.

## Conflict
A conflict contsins a name, similar to step name. It contains one or more field changes. When the `mergeBehaviour` is `merge`, the user can choose to apply or unapply the conflict with a checkbox. Apply a conflict means take server's version of the data.

When the field(or related fields) are edited after the "Refreshed" step, the option to apply or unapply a conflict will be disabled.

## Special Steps
insert
delete
re-order

## Step

## Operational Transformation
before and after states -> operations


All Actions that chould change formData will create have editHistory middleware calculate step, except actions that could change the steps list, those are handles by ways other than middleware

//////////////////////
getFieldChanges(previousFormData: FormData, currentFormData: FormData): FieldChange[]
mergeFieldChanges(a: FieldChange, b: FieldChange): FieldChange[]
calculateStepName(fieldChanges: FieldChange[]): string

// middleware after each action that changes formData
calculateSteps(
  previousStep: Step,
  previousFormData: FormData = defaultFormData,
  currentFormData: FormData)
  : Step[]

// Manipulate formData
undoFieldChange(fieldChange: FieldChange, formData: Draft<FormData>): FormData | undefined

undoStep(step: Step, previousFormData: FormData | Draft<FormData>): FormData

redoFieldChange(fieldChange: FieldChange, formData: Draft<FormData>): FormData | undefined

redoStep(step: Step, previousFormData: FormData): FormData

SwitchToMerge(step: Step, currentFormData: FormData): FormData

SwitchToDiscardLocalChanges(step: Step, currentFormData: FormData): FormData

applyConflictToFromData(conflict: FieldChange, currentFormData: FormData): FormData

unApplyConflictToFromData(conflict: FieldChange, currentFormData: FormData): FormData

// refresh
ActivityToFormData(activity: ActivityWithDetailFromStore)

CalculateRefreshedStep(
  previousVersionFormData: FormData,
  currentFormData: FormData,
  storeActivity: ActivityWithDetailFromStore
): Step | undefined