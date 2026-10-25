import { currentAdmin } from "@/lib/server/auth";
import { saveImage } from "@/lib/server/storage";

const MAX_BYTES = 12 * 1024 * 1024;

/** Admin image upload: multipart "file" -> { url } (resized WebP). */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return Response.json({ error: "Not signed in" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (!file.type.startsWith("image/")) return Response.json({ error: "Please upload an image" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "Image is over 12 MB" }, { status: 400 });

  try {
    const url = await saveImage(Buffer.from(await file.arrayBuffer()));
    return Response.json({ url });
  } catch {
    return Response.json({ error: "Couldn't read that image" }, { status: 400 });
  }
}
