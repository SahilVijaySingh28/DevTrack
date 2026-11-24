const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const RefreshSession = require('../models/RefreshSession')
const User = require('../models/User')
const generateRefreshToken = require('./generateRefreshToken')
const { getRefreshTokenSecret } = require('./tokenConfig')

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex')
const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token)
  if (!decoded || typeof decoded.exp !== 'number') {
    throw new Error('Refresh token expiry is missing')
  }
  return new Date(decoded.exp * 1000)
}

const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, getRefreshTokenSecret())
    if (decoded.tokenUse !== 'refresh' || typeof decoded.userId !== 'string') return null
    return decoded
  } catch (error) {
    if (['JsonWebTokenError', 'NotBeforeError', 'TokenExpiredError'].includes(error.name)) return null
    throw error
  }
}

const createRefreshSession = async (userId) => {
  const token = generateRefreshToken(userId)
  const expiresAt = getTokenExpiry(token)
  await RefreshSession.create({
    user: userId,
    familyId: crypto.randomBytes(16).toString('hex'),
    tokenHash: hashRefreshToken(token),
    expiresAt,
  })
  return { token, expiresAt }
}

const rotateRefreshSession = async (token) => {
  const claims = verifyRefreshToken(token)
  if (!claims) return null

  const now = new Date()
  const tokenHash = hashRefreshToken(token)
  const nextToken = generateRefreshToken(claims.userId)
  const nextTokenHash = hashRefreshToken(nextToken)
  const expiresAt = getTokenExpiry(nextToken)

  return mongoose.connection.transaction(async (session) => {
    const currentSession = await RefreshSession.findOneAndUpdate(
      { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
      { $set: { revokedAt: now } },
      { new: false, session },
    )

    if (!currentSession) {
      const previousSession = await RefreshSession.findOne({ tokenHash }).session(session)
      if (previousSession?.revokedAt) {
        await RefreshSession.updateMany(
          { familyId: previousSession.familyId, revokedAt: null },
          { $set: { revokedAt: now } },
          { session },
        )
      }
      return null
    }

    if (String(currentSession.user) !== claims.userId) {
      await RefreshSession.updateMany(
        { familyId: currentSession.familyId, revokedAt: null },
        { $set: { revokedAt: now } },
        { session },
      )
      return null
    }

    const user = await User.findById(currentSession.user)
      .select('name email avatar createdAt updatedAt')
      .session(session)
      .lean()

    if (!user) {
      await RefreshSession.updateMany(
        { familyId: currentSession.familyId, revokedAt: null },
        { $set: { revokedAt: now } },
        { session },
      )
      return null
    }

    await RefreshSession.create([{
      user: currentSession.user,
      familyId: currentSession.familyId,
      tokenHash: nextTokenHash,
      expiresAt,
    }], { session })

    return { token: nextToken, expiresAt, user }
  })
}

const revokeRefreshSession = async (token) => {
  if (!token) return

  const session = await RefreshSession.findOne({ tokenHash: hashRefreshToken(token) })
  if (!session) return

  await RefreshSession.updateMany(
    { familyId: session.familyId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  )
}

module.exports = {
  createRefreshSession,
  hashRefreshToken,
  revokeRefreshSession,
  rotateRefreshSession,
}
