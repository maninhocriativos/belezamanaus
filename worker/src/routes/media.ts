import type { Env } from "../env";

const maxUploadBytes = 25 * 1024 * 1024;

function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "arquivo";
}

function publicUrlFor(request: Request, env: Env, key: string) {
  const baseUrl = env.R2_PUBLIC_BASE_URL?.replace(/\/+$/g, "");
  if (baseUrl) return `${baseUrl}/${key}`;
  const url = new URL(request.url);
  return `${url.origin}/media/${key}`;
}

export async function handleMedia(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") {
    if (!env.MEDIA_BUCKET) {
      return Response.json({ error: "R2 nao esta configurado." }, { status: 501 });
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.replace(/^\/media\/?/, ""));
    if (!key) return Response.json({ error: "Arquivo nao informado." }, { status: 400 });

    const object = await env.MEDIA_BUCKET.get(key);
    if (!object) return Response.json({ error: "Arquivo nao encontrado." }, { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    return new Response(object.body, { headers });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!env.MEDIA_BUCKET) {
    return Response.json(
      {
        error: "R2 nao esta configurado. Vincule um bucket como MEDIA_BUCKET e defina R2_PUBLIC_BASE_URL para envio publico."
      },
      { status: 501 }
    );
  }

  const formData = await request.formData();
  const entry = formData.get("file");
  if (typeof entry !== "object" || entry === null || !("stream" in entry) || !("size" in entry)) {
    return Response.json({ error: "Envie o arquivo no campo file." }, { status: 400 });
  }
  const file = entry as File;

  if (file.size > maxUploadBytes) {
    return Response.json({ error: "Arquivo acima do limite de 25 MB." }, { status: 413 });
  }

  const organizationId = safeFileName(String(formData.get("organizationId") ?? "beleza-manaus"));
  const conversationId = safeFileName(String(formData.get("conversationId") ?? "sem-conversa"));
  const originalName = safeFileName(file.name || "arquivo");
  const key = `${organizationId}/${conversationId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${originalName}`;

  await env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: {
      contentDisposition: `inline; filename="${originalName}"`,
      contentType: file.type || "application/octet-stream"
    },
    customMetadata: {
      conversationId: String(formData.get("conversationId") ?? ""),
      originalName
    }
  });

  return Response.json({
    key,
    mediaMimeType: file.type || "application/octet-stream",
    mediaSize: file.size,
    mediaUrl: publicUrlFor(request, env, key),
    ok: true,
    originalName
  });
}
