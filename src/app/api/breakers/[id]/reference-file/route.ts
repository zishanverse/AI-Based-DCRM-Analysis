// app/api/breakers/[id]/reference-file/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadImage } from "@/lib/imagekit";

// POST/PUT - Upload or Update Reference File for a Breaker
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: breakerId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: "Only CSV files are allowed" },
        { status: 400 }
      );
    }

    // Check if breaker exists
    const breaker = await db.breaker.findUnique({
      where: { id: breakerId },
      include: { dataSource: true },
    });

    if (!breaker) {
      return NextResponse.json(
        { error: "Breaker not found" },
        { status: 404 }
      );
    }

    // Upload file to ImageKit/S3
    const fileUrl = await uploadImage(file, "dcrm_reference_files");

    // Upsert DataSource
    let dataSource;
    
    if (breaker.dataSourceId) {
      // Update existing DataSource
      dataSource = await db.dataSource.update({
        where: { id: breaker.dataSourceId },
        data: {
          fileName: file.name,
          fileUrl: fileUrl,
          description: `Reference CSV for ${breaker.name}`,
          status: "COMPLETED",
          updatedAt: new Date(),
        },
      });

      console.log(`Updated existing DataSource ${dataSource.id} for Breaker ${breaker.name}`);
    } else {
      // Create new DataSource
      dataSource = await db.dataSource.create({
        data: {
          fileName: file.name,
          fileUrl: fileUrl,
          description: `Reference CSV for ${breaker.name}`,
          status: "COMPLETED",
        },
      });

      // Link DataSource to Breaker
      await db.breaker.update({
        where: { id: breakerId },
        data: {
          dataSourceId: dataSource.id,
        },
      });

      console.log(`Created new DataSource ${dataSource.id} and linked to Breaker ${breaker.name}`);
    }

    return NextResponse.json({
      success: true,
      message: breaker.dataSourceId 
        ? "Reference file updated successfully" 
        : "Reference file uploaded successfully",
      data: {
        dataSourceId: dataSource.id,
        fileName: dataSource.fileName,
        fileUrl: dataSource.fileUrl,
        isUpdate: !!breaker.dataSourceId,
      },
    });
  } catch (error) {
    console.error("Error uploading reference file:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload reference file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET - Get Reference File Info for a Breaker
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: breakerId } = await params;

    const breaker = await db.breaker.findUnique({
      where: { id: breakerId },
      include: { dataSource: true },
    });

    if (!breaker) {
      return NextResponse.json(
        { error: "Breaker not found" },
        { status: 404 }
      );
    }

    if (!breaker.dataSource) {
      return NextResponse.json({
        success: true,
        hasReferenceFile: false,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasReferenceFile: true,
      data: {
        id: breaker.dataSource.id,
        fileName: breaker.dataSource.fileName,
        fileUrl: breaker.dataSource.fileUrl,
        description: breaker.dataSource.description,
        status: breaker.dataSource.status,
        uploadedAt: breaker.dataSource.createdAt,
        updatedAt: breaker.dataSource.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching reference file:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reference file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove Reference File from a Breaker
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: breakerId } = params;

    const breaker = await db.breaker.findUnique({
      where: { id: breakerId },
      include: { dataSource: true },
    });

    if (!breaker) {
      return NextResponse.json(
        { error: "Breaker not found" },
        { status: 404 }
      );
    }

    if (!breaker.dataSourceId) {
      return NextResponse.json(
        { error: "No reference file to delete" },
        { status: 404 }
      );
    }

    // Unlink DataSource from Breaker
    await db.breaker.update({
      where: { id: breakerId },
      data: {
        dataSourceId: null,
      },
    });

    // Check if DataSource is used by other breakers
    const otherBreakers = await db.breaker.count({
      where: { dataSourceId: breaker.dataSourceId },
    });

    // If no other breakers use this DataSource, delete it
    if (otherBreakers === 0) {
      await db.dataSource.delete({
        where: { id: breaker.dataSourceId },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Reference file removed successfully",
    });
  } catch (error) {
    console.error("Error deleting reference file:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete reference file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}