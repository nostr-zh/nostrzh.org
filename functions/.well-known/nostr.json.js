export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, OPTIONS',
        'access-control-allow-headers': '*',
      },
    })
  }

  const url = new URL(request.url)
  const upstream = new URL('https://api.nostrzh.org/.well-known/nostr.json')

  upstream.search = url.search

  const resp = await fetch(upstream.toString(), {
    headers: {
      Accept: "application/json",
    },
  })

  return new Response(resp.body, {
    status: resp.status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=300',
    },
  })
}
