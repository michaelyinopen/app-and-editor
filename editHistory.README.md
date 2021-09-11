# Edit History

## Version Token
Token for a specific version. If data is saved, version token changes, therefore can detect change by comparing the version tokens.

## Field Change

Can undo and redo each field change.

## Merged Field Change
If the a field's value changes consecutively, it will count as one field change. It is implemented my merging the new change with the last field change.

## Operation
todo: remove

## Step

## Conflict

//////////////////////////////////

## Special Steps
insert
delete
re-order

## Step

## Merge steps
reorder might merge multiple operations

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