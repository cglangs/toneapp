const jwt = require('jsonwebtoken')
const ACCESS_SECRET = 'my_access_secret'
const REFRESH_SECRET = 'my_refresh_secret'

function getUserId(context) {
  const Authorization = context.request.get('Authorization')
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '')
    const { userId } = jwt.verify(token, APP_SECRET)
    return userId
  }

  throw new Error('Not authenticated')
}

module.exports = {
  ACCESS_SECRET,
  REFRESH_SECRET,
  getUserId,
}
