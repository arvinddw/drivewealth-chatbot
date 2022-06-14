const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/events', (req, res) => {
    console.log(req.body)
    res.json({message: 'OK'})
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})