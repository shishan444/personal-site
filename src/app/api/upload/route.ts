import { type NextRequest, NextResponse } from "next/server";
import { persistUpload, type UploadResult } from "@/lib/assets";
import { getSession } from "@/lib/auth";

const MAX_BYTES = Number(process.env.UPLOAD_MAX_MB ?? 20) * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "NO_FILE" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE", maxBytes: MAX_BYTES }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let result: UploadResult;
  try {
    result = await persistUpload({
      buffer,
      originalFilename: file.name || "untitled",
      mimeType: file.type || "application/octet-stream",
      uploadedBy: session.userId,
    });
  } catch (err) {
    console.error("[upload] persist failed", err);
    return NextResponse.json({ error: "PERSIST_FAILED" }, { status: 500 });
  }

  return NextResponse.json(
    {
      asset: result.asset,
      layout: {
        publicUrl: result.layout.publicUrl,
        thumbnailUrl: result.layout.thumbnailRelativePath,
        storagePath: result.layout.relativePath,
      },
      isDuplicate: result.isDuplicate,
    },
    { status: result.isDuplicate ? 200 : 201 },
  );
}
