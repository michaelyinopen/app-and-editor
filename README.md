# app-and-editor
Proof of concept of job-shop-collection's Job Set Editor's interactions with other parts of the app.

## Run with MSW mocked responses
Can query but will not save.
```
npm start
```

## Run with a server
Can query and save.
```
npm run start-server
npm run start-web
```

## Collaborative Editing

### Version Token
Token for a specific version. If data changed, version token will change, therefore can detect change by comparing the version tokens.

### Field

#### Collection Field

### Operation
Field change (might be merged, e.g.typing)

### Special Steps
insert
delete
re-order

### Step

### Merge steps
reorder might merge multiple operations

### Operational Transformation
before and after states -> operations