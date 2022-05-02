import { db } from '../../postgresdb'
import { GraphQLError } from 'graphql'

export default {
  Query: {
    getPersonas: async (_, __, { auth }) => {
      if (!auth) throw new GraphQLError('Sesión no válida')
      try {
        return await db.manyOrNone('SELECT p.id, nombre, id_grupo, grupo FROM personas p, grupos g WHERE p.id_grupo = g.id ORDER BY p.id')
      } catch (e) {
        throw new GraphQLError(e.message)
      }
    }
  },
  Mutation: {
    savePersona: async (_, { input }, { auth }) => {
      if (!auth) throw new GraphQLError('Sesión no válida')

      try {
        const { nombre, telefono, id_grupo } = input

        return db.tx(async t => {
          if (input?.id) {
            await t.none('UPDATE personas SET nombre = $1, id_grupo = $2 WHERE id = $3', [nombre, id_grupo, input.id])

            await t.none('UPDATE telefonos SET numero = $1 WHERE id_persona = $2', [telefono.replace('(', '').replace(')', '').replace(' ', '').replace('-', ''), input.id])
          } else {
            const { id: id_persona } = await t.one('INSERT INTO personas (nombre, id_grupo) VALUES ($1, $2) RETURNING id', [nombre, id_grupo])

            await t.none('INSERT INTO telefonos (id_persona, numero) VALUES ($1, $2)', [id_persona, telefono.replace('(', '').replace(')', '').replace(' ', '').replace('-', '')])
          }
        }).then(data => {
          return true
        }).catch(error => {
          throw new GraphQLError(error.message)
        })
      } catch (e) {
        throw new GraphQLError(e.message)
      }
    },
    deletePersona: async (_, { id }, { auth }) => {
      if (!auth) throw new GraphQLError('Sesión no válida')

      try {
        return db.tx(async t => {
          await t.none('DELETE FROM telefonos WHERE id_persona = $1', [id])
          await t.none('DELETE FROM personas WHERE id = $1', [id])
        }).then(data => {
          return true
        }).catch(error => {
          throw new GraphQLError(error.message)
        })
      } catch (e) {
        throw new GraphQLError(e.message)
      }
    },
    deletePersonas: async (_, { ids }, { auth }) => {
      if (!auth) throw new GraphQLError('Sesión no válida')

      try {
        return db.tx(async t => {
          for (const id of ids) {
            await t.none('DELETE FROM telefonos WHERE id_persona = $1', [id])
            await t.none('DELETE FROM personas WHERE id = $1', [id])
          }
        }).then(data => {
          return true
        }).catch(error => {
          throw new GraphQLError(error.message)
        })
      } catch (e) {
        throw new GraphQLError(e.message)
      }
    }
  },
  Persona: {
    telefono: async (root) => {
      const { numero } = await db.one('SELECT numero FROM telefonos WHERE id_persona = $1', [root.id])
      return numero
    }
  }
}
