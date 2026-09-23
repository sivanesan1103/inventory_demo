// Thin fetch wrapper: JSON in/out, throws Error(message) on non-2xx.
async function request(method, url, body) {
  let res
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    })
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }
  // Vite's dev proxy answers 500/502/504 with no JSON body when the API server is down.
  if (res.status >= 500 && !res.headers.get('content-type')?.includes('json')) {
    throw new Error('Server is not running. Start it with "npm run dev".')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body = {}) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  del: (url) => request('DELETE', url),
}
