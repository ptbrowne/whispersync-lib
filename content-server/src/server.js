const fsNormal = require('fs')
const path = require('path')
const fs = require('fs').promises
const fastify = require('fastify')()
const handlebars = require('handlebars')
const layouts = require('handlebars-layouts')
const keyBy = require('lodash/keyBy')
const sortBy = require('lodash/sortBy')
const { fetchBook, fetchBooks } = require('../../whispersync-client/src/cache')

const TEMPLATES_FOLDER = path.join(__dirname, 'templates')

handlebars.registerHelper(layouts(handlebars))
handlebars.registerHelper({
  tojson: data => JSON.stringify(data, null, 2)
})
handlebars.registerPartial(
  'layout',
  fsNormal.readFileSync(path.join(TEMPLATES_FOLDER, 'layout.hbs'), 'utf8')
)

fastify.register(require('point-of-view'), {
  root: TEMPLATES_FOLDER,
  engine: {
    handlebars: handlebars
  }
})

const index = async (req, reply, options) => {
  const books = sortBy(await fetchBooks(), options.sortBy)
  reply.view('index.hbs', { books })
  return reply
}

fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/'
})

fastify.get('/', async (req, reply) => {
  await index(req, reply, {
    sortBy: book => book.title
  })
  return reply
})

fastify.get('/index/title', async (req, reply) => {
  await index(req, reply, {
    sortBy: book => book.title
  })
  return reply
})

fastify.get('/index/author', async (req, reply) => {
  await index(req, reply, {
    sortBy: book => book.authors[0]
  })
  return reply
})

fastify.get('/books/:asin', async (req, reply) => {
  const book = await fetchBook(req.params.asin)
  reply.view('book.hbs', { book })
  return reply
})

fastify.listen(3000, err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
