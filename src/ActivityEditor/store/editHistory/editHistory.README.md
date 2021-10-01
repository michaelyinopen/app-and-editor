# Edit History

## Version Token
Token for a specific version. If data is saved, version token changes, therefore can detect change by comparing the version tokens.

## Path
Json Pointers-like, starts with `/`. e.g. `/who`.

## Field Change

Records a change of value in path's location.
Can undo and redo each field change.

## Merged Field Change
//renamed to combine
If the a field's value changes consecutively, it will count as one field change. It is implemented by combining the new change with the last field change. `mergeFieldChanges`

## Step
Related and consecutive field changes will count as one step. One step can have one field change, or multiple field changes. It is implemented my merging the new change with the last step. `calculateSteps`

If a step has `VersionToken`, the step is a "Refreshed" step. `mergeBehaviour` can either be `merge` or `discard local changes`.

// todo rewrite bacause changed to use operation
When `mergeBehaviour` is `merge`, `fieldChanges` and `conflicts` both represents server-side changes merged to the current form data. `fieldChanges` contains fields that are changed only in the server.`conflicts` contains fields that are changed in the server and locally.

When `mergeBehaviour` is `discard local changes`, all `conflicts` are applied and `reverseLocalFieldChanges` are also applied. The result formData will be the server-side's formData.

`saveStatus` shows that the formData at that step is saved by the user, and that step will not merge with later changes. `saveStatus` is not reliable, and is intended only for giving the user a hint.

## Operation
type: 'edit' | 'merge' | 'conflict' | 'reverse local'
fieldChanges
applied: all field changes must be applied or unapplied together

Note: an edit step will have one opertion

## GroupedFieldChanges

## Conflict
A conflict contsins a name, similar to step name. It contains one or more field changes. When the `mergeBehaviour` is `merge`, the user can choose to apply or unapply the conflict with a checkbox. Apply a conflict means take server's version of the data, unapply means take the local version.

When the field(or related fields) are edited after the "Refreshed" step, the option to apply or unapply a conflict will be disabled.

//////////////////////////////
## Grouped
Field changes that count as the same step, only have sequence

## Related Change
conflict will be disabled when there is a related change

## Special Steps
insert
delete
re-order


## Operational Transformation
before and after states -> operations

/////////////
All Actions that chould change formData will have editHistory middleware calculate step, except actions that could change the steps list, those are handles by ways other than middleware


Must use draft update pattern for formData manipulation
need to use produce for every field change, because there can be replacement of an object property (collection add) and the new part is not drafted

///////////////////
//////////////////////////////////


### Example: use local

### Example: merge changes

### Example: merge changes with conflict resolution(apply/unapply + manual edit)

### Example: discard local changes

## Edit History
// add link



// todo lifecycle flow of refreshed
// todo lifecycle flow of create

// todo types of changes:
- property field change
- add to collection
- collection item property change
- collection items sequence change
- remove from collection



///////////
## Edit patterns
### Edit field
App store state
API types
- setActivityFromAppStore(not loaded)
- setActivityFromAppStore (loaded) (hasDetail)
  - formData
  - initialized
  - versions
- edit
  - formData update
  - step
    - combine field changes
    - undo
    - redo
- refreshed setActivityFromAppStore (initialized)
  - merge/ reverse local
  - related to conflict
- save

- refreshed data
  - refreshed step(different local/remote changes)

### Remove item from collection

### Move items in collection

### Edit collection's item's field

### Add item to collection