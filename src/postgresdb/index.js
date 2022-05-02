import promise from 'bluebird'
import pgPromise from 'pg-promise'
import postgresConfig from '../../postgres-config.json'
// import {Diagnostics} from './diagnostics'

const initOptions = {
  promiseLib: promise
}
const pgp = pgPromise(initOptions)
export const db = pgp(postgresConfig)
// Diagnostics.init(initOptions);
