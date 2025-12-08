import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/imagekit";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload to ImageKit (or S3/CDN)
    const url = await uploadImage(file, "global_indians/images");

    let type = "IMAGE";
    if (file.type === "application/pdf") {
      type = "DOCUMENT";
    }

    // Save to DB
    const media = await db.dataSource.create({
      data: {
        fileUrl : url,
        fileName : file.name,
        description : file.type,
        status : "PENDING",
      },
    });

    return NextResponse.json({ url: media.fileUrl, mediaId: media.id });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
