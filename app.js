import express from 'express'
import formidable from 'formidable'
import bodyParser from 'body-parser'
import { readdir, readFileSync, writeFileSync } from 'fs'
import { createToken, checkToken } from './services/jwt.service.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.listen(3000)

/**
 * -----------
 * HTML Routes
 * -----------
 */

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})
app.get('/pdfs', (req, res) => {
  res.sendFile(__dirname + '/views/pdfs.html')
})
app.use('/pdf', express.static(__dirname + '/uploads'))

/**
 * -----------
 * Data Routes
 * -----------
 */

// POST /auth -> Pour récupérer un jwt
app.post('/auth', (req, res) => {
  res.json({ jwt: createToken() })
})

// GET /upload -> Récupérer les pdfs enregistrés
app.get('/upload', (req, res, next) => {
  const uploadPath = `${__dirname}/uploads`
  readdir(uploadPath, (err, files) => {
    if(err) return next(err)
    const urls = files.map((filename) => ({
      url: `http://localhost:3000/pdf/${filename}`,
      name: filename.split("-")[1]
    }))
    res.json({ files: urls })
  })
})

// POST /upload -> Upload un pdf
app.post('/upload', (req, res, next) => {

  const form = formidable({})

  form.parse(req, (err, fields, file) => {

    const { jwt, name } = fields
    const { mimetype, originalFilename: fileName, newFilename, size, filepath } = file.file
    const extension = fileName.slice(-3)

    // FormData parse error
    if (err)
      return next(Error('Parse error'))

    // JWT auth
    if (!checkToken(jwt))
      return next(Error('Wrong JWT'))

    // Check form name input
    if (!name.toString().trim())
      return next(Error('No file name'))

    // Check size
    if (!size)
      return next(Error('No file'))

    // Check size
    if (size >= 1000000)
      return next(Error('File is too large. Max size : 1Mo'))

    // Check file type
    if (mimetype !== "application/pdf" || extension !== "pdf")
      return next(Error('Wrong file type. Server only accept PDF'))
      
    // Store file in uploads directory
    const oldPath = filepath
    const newPath = `${__dirname}/uploads/${newFilename}-${name}.pdf`
    const rawData = readFileSync(oldPath)
    writeFileSync(newPath, rawData)

    res.status(200).json({ message: 'Upload success' })
  })
})

/**
 * -------------
 * Error Handler
 * -------------
 */
app.use((err, req, res, next) => {
  res.status(500).json({ errorMsg: err.message || "Error" })
})