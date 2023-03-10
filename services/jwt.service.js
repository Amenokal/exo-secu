import jwt from 'jsonwebtoken'
const JWT_SECRET = "supersecret"

export function createToken() {
  return jwt.sign({ token: 'auth' }, JWT_SECRET, { expiresIn: '1h' })
}

export function checkToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  }
  catch (err) {
    return false
  }
}
