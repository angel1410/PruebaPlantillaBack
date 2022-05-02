import express from 'express'
import cors from 'cors'
import * as fs from 'fs'
import * as util from 'util'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema, NoSchemaIntrospectionCustomRule } from 'graphql'
import 'core-js/stable'
import 'regenerator-runtime/runtime'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()
const { SECRET_KEY, PORT, ALLOWED_ORIGINS } = process.env
const DEVELOPMENT = JSON.parse(process.env.DEVELOPMENT)
const readdir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const app = express()
let customTypes = ''
let queries = ''
let mutations = ''
let typeDefs = ''
let schema = ''
const resolvers = { Query: {}, Mutation: {} }

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const corsOptions = {
  origin: ALLOWED_ORIGINS.split(','),
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions))

const createSchema = async () => {
  const rootDir = `${__dirname}/GraphQL`
  const typeFiles = await readdir(`${rootDir}/Types`).then(res => {
    return res
  })

  for (const file of typeFiles) {
    await readFile(`${rootDir}/Types/${file}`, 'utf8').then(res => {
      const indexTypeQuery1 = res.toString().search('type.{1,5}Query.{0,5}{')
      const indexTypeQuery2 = res.indexOf('}', indexTypeQuery1) + 1

      let typeQuery = ''
      if (indexTypeQuery1 >= 0) {
        typeQuery = res.toString().substring(indexTypeQuery1, indexTypeQuery2)
      }

      const indexTypeMutation1 = res.toString().search('type.{1,5}Mutation.{0,5}{')
      const indexTypeMutation2 = res.indexOf('}', indexTypeMutation1) + 1

      let typeMutation = ''
      if (indexTypeMutation1 >= 0) {
        typeMutation = res.toString().substring(indexTypeMutation1, indexTypeMutation2)
      }

      customTypes += '\n' + res.toString().replace(typeQuery, '').replace(typeMutation, '')
      queries += typeQuery.substring(typeQuery.indexOf('{') + 1, typeQuery.lastIndexOf('}'))
      mutations += typeMutation.substring(typeMutation.indexOf('{') + 1, typeMutation.lastIndexOf('}'))
    })
  }

  const resolverFiles = await readdir(`${rootDir}/Resolvers`).then(res => {
    return res
  })

  for (const file of resolverFiles) {
    const module = await import(`${rootDir}/Resolvers/${file}`)
    resolvers.Query = { ...resolvers.Query, ...module.default?.Query }
    resolvers.Mutation = { ...resolvers.Mutation, ...module.default?.Mutation }
    Object.keys(module.default).forEach(r => {
      if (r !== 'Query' && r !== 'Mutation') {
        Object.assign(resolvers, { [r]: module.default[r] })
      }
    })
  }
  typeDefs = `${customTypes}
                type Query {
                    ${queries}
                }
                type Mutation {
                    ${mutations}
                }`
  const _schemaTypeDefs = buildSchema(typeDefs)

  schema = makeExecutableSchema({
    typeDefs: _schemaTypeDefs,
    resolvers: resolvers
  })

  const verifyToken = (req, res, next) => {
    if (req?.body?.query?.includes('query Publica')) {
      req.auth = true
      next()
      return
    }

    const bearerHeader = req.headers.authorization
    const ALLOWED_ORIGINS_ARRAY = ALLOWED_ORIGINS.split(',')
    const allowedOrigin = req.headers.origin && ALLOWED_ORIGINS_ARRAY.includes(req.headers.origin)

    if (allowedOrigin) {
      if (typeof bearerHeader !== 'undefined') {
        req.token = bearerHeader.split(' ')[1]
        jwt.verify(req.token, SECRET_KEY, (error, decoded) => {
          req.auth = error ? false : decoded
        })
      } else {
        req.auth = false
      }
      next()
    } else {
      if (req.headers.host === 'localhost:8000' && DEVELOPMENT) {
        req.auth = true
        next()
      } else {
        res.sendStatus(401)
      }
    }
  }

  app.use('/graphql', verifyToken, graphqlHTTP({
    schema,
    graphiql: DEVELOPMENT,
    validationRules: DEVELOPMENT ? null : [NoSchemaIntrospectionCustomRule]
  }))
}
createSchema().then(() => console.log('Esquema creado')).catch(e => console.error('Error: ' + e.message))

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo por el ${PORT} en localhost 🚀`)
})
