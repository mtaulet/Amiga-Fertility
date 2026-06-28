let cachedToken: { token: string; expiresAt: number } | null = null

async function getManagementToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token

  const res = await fetch(`https://${process.env.AUTH0_MGMT_DOMAIN}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.AUTH0_MGMT_CLIENT_ID,
      client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_MGMT_DOMAIN}/api/v2/`,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Failed to get management token: ${data.error_description ?? res.status}`)

  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
  return cachedToken.token
}

function mgmtFetch(path: string, options: RequestInit = {}) {
  return getManagementToken().then(token =>
    fetch(`https://${process.env.AUTH0_MGMT_DOMAIN}/api/v2${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
    })
  )
}

export async function createProviderUser(email: string, password: string): Promise<{ user_id: string }> {
  const res = await mgmtFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      connection: 'Username-Password-Authentication',
      email_verified: false,
      app_metadata: { roles: ['provider'] },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Failed to create user')
  return data
}

export async function assignProviderRole(auth0UserId: string): Promise<void> {
  const roleId = process.env.AUTH0_PROVIDER_ROLE_ID
  if (!roleId) throw new Error('AUTH0_PROVIDER_ROLE_ID not configured')
  const res = await mgmtFetch(`/users/${encodeURIComponent(auth0UserId)}/roles`, {
    method: 'POST',
    body: JSON.stringify({ roles: [roleId] }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.message ?? 'Failed to assign role')
  }
}
