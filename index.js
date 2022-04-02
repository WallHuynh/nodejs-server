import http from 'http'
import fs from 'fs'
import fsPromises from 'fs/promises'
import logEvents from './logEvents.js'
import events from 'events'
import 'dotenv/config'

//initial __dirname, __filename in ES6 module
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const eventEmitter = new events.EventEmitter()
eventEmitter.on('log', (msg, fileName) => logEvents(msg, fileName))
const port = process.env.PORT || 8888

const serverFile = async (filePath, contentType, response) => {
  try {
    const rawData = await fsPromises.readFile(
      filePath,
      !contentType.includes('image') ? 'utf8' : ''
    )
    const data =
      contentType === 'application/json' ? JSON.parse(rawData) : rawData
    response.writeHead(filePath.includes('404.html') ? 404 : 200, {
      'Context-Type': contentType,
    })
    response.end(data)
  } catch (err) {
    console.log(err)
    eventEmitter.emit('log', `${err.name}:${err.message}`, 'errorLog.txt')
    response.statusCode = 500
    response.end()
  }
}

const server = http.createServer(function (req, res) {
  console.log(req.url, req.method)
  eventEmitter.emit('log', `${req.url}\t${req.method}`, 'reqLog.txt')
  const extension = path.extname(req.url)
  let contentType
  switch (extension) {
    case '.css':
      contentType = 'text/css'
      break
    case '.js':
      contentType = 'text/javascript'
      break
    case '.json':
      contentType = 'application/json'
      break
    case '.jpg':
      contentType = 'image/jpeg'
      break
    case '.jpeg':
      contentType = 'image/jpeg'
      break
    case '.png':
      contentType = 'image/png'
      break
    case '.txt':
      contentType = 'text/plain'
      break
    default:
      contentType = 'text/html'
  }

  let filePath =
    contentType === 'text/html' && req.url === '/'
      ? path.join(__dirname, 'views', 'index.html')
      : contentType === 'text/html' && req.url.slice(-1) === '/'
      ? path.join(__dirname, 'views', req.url, 'index.html')
      : contentType === 'text/html'
      ? path.join(__dirname, 'views', req.url)
      : path.join(__dirname, req.url)

  if (!extension && req.url.slice(-1) !== '/') {
    filePath += '.html'
  }

  const fileExists = fs.existsSync(filePath)

  if (fileExists) {
    serverFile(filePath, contentType, res)
  } else {
    switch (path.parse(filePath).base) {
      case 'old-page.html':
        res.writeHead(301, { Location: '/new-page.html' })
        res.end()
        break
      case 'www-page.html':
        res.writeHead(301, { Location: '/' })
        res.end()
        break
      default:
        serverFile(path.join(__dirname, 'views', '404.html'), 'text/html', res)
    }
  }
})

server.listen(port, () => console.log(`host run port:${port}`))
