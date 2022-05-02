import { db } from '../../postgresdb'
import { GraphQLError } from 'graphql'

export default {
  Query: {
    getGrupos: async (_, __, { auth }) => {
      if (!auth) throw new GraphQLError('Sesión no válida')
      try {
        return await db.manyOrNone('SELECT id, grupo FROM grupos')
      } catch (e) {
        throw new GraphQLError(e.message)
      }
    }
  }
}
