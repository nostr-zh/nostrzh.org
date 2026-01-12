export const onRequest = async () => {
  const resp = await fetch("https://api.nostrzh.org/.well-known/nostr.json", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: "upstream error" }), {
      status: 502,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  const data = await resp.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
    },
  });
};
