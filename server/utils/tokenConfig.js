const minimumSecretBytes = 32

const getTokenSecrets = () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET
  const refreshSecret = process.env.JWT_REFRESH_SECRET
  const isPlaceholder = (secret) => /^(replace-with|your-)/i.test(secret || '')

  if (!accessSecret || Buffer.byteLength(accessSecret) < minimumSecretBytes || isPlaceholder(accessSecret)) {
    throw new Error('JWT_ACCESS_SECRET must be a non-placeholder random value of at least 32 bytes')
  }
  if (!refreshSecret || Buffer.byteLength(refreshSecret) < minimumSecretBytes || isPlaceholder(refreshSecret)) {
    throw new Error('JWT_REFRESH_SECRET must be a non-placeholder random value of at least 32 bytes')
  }
  if (accessSecret === refreshSecret) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different')
  }

  return { accessSecret, refreshSecret }
}

const getAccessTokenSecret = () => getTokenSecrets().accessSecret
const getRefreshTokenSecret = () => getTokenSecrets().refreshSecret

module.exports = { getAccessTokenSecret, getRefreshTokenSecret, getTokenSecrets }
