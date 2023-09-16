const express = require('express')
const app = express()
const port = 3000

app.use(express.static(__dirname + '/'));

app.get('/', (req, res) => {
    res.render('index.html')
})

app.listen(port, () => {
    console.log(`Página rodando na porta: ${port}`)
})
