## Phineas Javascript SDK

### Installation (browserify/webpack)
```
npm install --save phineas-sdk
```

or standalone build in `dist/standalone.js` which makes `Phineas` available globally.

### Usage
```
const Phineas = require('phineas-sdk')

// appID and secret available from web UI 
const app = Phineas.inititalize({
	appID: <app_id>
  secret: <secret>
})

// 'Users' is the name of DynamoDB table
const UserTable = app.table('Users')

const username = 'alice'
const subscription = UserTable.subscribe('getUserInfo', username, function (err, data) {
  if(err) {
    throw err
  } 

  console.log(data)
})


subscription
  .on('INSERT', function (event) {
    console.log('new item added', event.newItem)
  })
  .on('MODIFY', function (e) {
    console.log('item modified', e.oldItem, e.newItem)
  })
  .on('REMOVE', function (e) {
    console.log('item deleted', e.oldItem)
  })

// unsubscribe
UserTable.unsubscribe('getUserInfo', username)

```








