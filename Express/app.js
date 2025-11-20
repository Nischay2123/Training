const express = require('express')
const app = express()

const people = require('./Routes/people')
const auth = require('./Routes/auth')

app.use(express.static('./methods-public'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use('/api/people', people)
app.use('/login', auth)

app.listen(8000, () => {
  console.log('Server is listening on: http://localhost:8000')
})
