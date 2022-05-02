import { db } from '../../postgresdb'
import CryptoJS from 'crypto-js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { GraphQLError } from 'graphql'

dotenv.config()

export default {
  Query: {
    login: async (_, { input }) => {
      const { SECRET_KEY, SECRET_KEY_CAPTCHA, DEVELOPMENT } = process.env
      const { usuario } = input
      try {
        /* Validación captcha */
        /* if (!JSON.parse(DEVELOPMENT)) {
          const { data } = await axios({
            method: 'POST',
            url: `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY_CAPTCHA}&response=${captcha}`
          }).catch(_ => {
            throw new Error('Error consultando captcha')
          })
          if (!data.success) {
            return CryptoJS.AES.encrypt(JSON.stringify({ status: 202, message: 'Captcha incorrecto.', type: 'error' }), SECRET_KEY).toString()
          }
        } */
        /* Fin Validación captcha */

        /* const claveDesencriptada = CryptoJS.AES.decrypt(clave, SECRET_KEY).toString(CryptoJS.enc.Utf8)
        const hashClave = CryptoJS.SHA256(claveDesencriptada).toString()

        const consultaNomina = await dbi.oneOrNone(`SELECT tp_situacion situacion, co_codigo_empleado codigo_empleado, tx_tipo_emp tipo_emp, tx_sexo sexo
                                                        FROM inet.h001t_nomina WHERE nu_cedula = $1`, [numCedula])
        if (consultaNomina) {
          const { situacion } = consultaNomina
          if (situacion !== 'A') return { status: 500, message: 'Usted se encuentra inactivo en el Sistema!', type: 'error' }
        }
        const login = await dbs.oneOrNone('SELECT id, nacionalidad, cedula, nombre, apellido, correo, id_rol, permisos_adicionales FROM auth.usuarios WHERE cedula = $1 AND clave = $2;', [numCedula, hashClave])

        if (login) {
          const { id: id_usuario, id_rol, nacionalidad, cedula, nombre, apellido, correo, permisos_adicionales } = login

          const { codigo_empleado, tipo_emp, sexo } = consultaNomina
          login.token = jwt.sign({
            id_usuario,
            codigo_empleado,
            id_rol,
            permisos_adicionales,
            nacionalidad,
            cedula,
            nombre,
            apellido,
            correo,
            tipo_emp,
            sexo
          }, SECRET_KEY, { expiresIn: 60 * 10 })
          return CryptoJS.AES.encrypt(JSON.stringify({ status: 200, message: 'Acceso permitido. Cargando Datos...', type: 'success', response: login }), SECRET_KEY).toString()
        } else {
          return CryptoJS.AES.encrypt(JSON.stringify({ status: 202, message: 'Usuario y/o Contraseña Incorrectos.', type: 'error' }), SECRET_KEY).toString()
        } */

        // SOLO PARA LA PLANTILLA:

        const login = {}
        login.token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: 60 * 10000 })

        return CryptoJS.AES.encrypt(JSON.stringify({ login }), SECRET_KEY).toString()
      } catch (e) {
        throw new GraphQLError(e.message)
      }
    },
    user: async (_, __, { auth }) => {
      if (!auth) throw new GraphQLError('Sesión no válida')
      const { SECRET_KEY } = process.env
      const { usuario } = auth
      auth.token = jwt.sign({ usuario }, SECRET_KEY, { expiresIn: 60 * 10000 })
      return CryptoJS.AES.encrypt(JSON.stringify(auth), SECRET_KEY).toString()
    }
  }
}
