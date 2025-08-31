//app/api/phone-numbers/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { phone_number, description } = await req.json();

    // Validate required fields
    if (!phone_number) {
      return NextResponse.json(
        { error: true, message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Create phone number with ElevenLabs API
    const response = await fetch("https://api.elevenlabs.io/v1/phone-numbers", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: phone_number,
        description: description || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.detail?.message || "Failed to create phone number",
          detail: data 
        },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      id: data.phone_number_id,
      phone_number: data.phone_number,
      description: data.description,
      created_at: data.created_at,
      raw: data,
    });

  } catch (error: any) {
    console.error("ElevenLabs phone number API error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal Server Error",
        detail: error?.message || error,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to list existing phone numbers
export async function GET(req: NextRequest) {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/phone-numbers", {
      method: "GET",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: true, 
          message: data.detail?.message || "Failed to fetch phone numbers",
          detail: data 
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      phone_numbers: data.phone_numbers || [],
      raw: data,
    });

  } catch (error: any) {
    console.error("ElevenLabs get phone numbers error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal Server Error",
        detail: error?.message || error,
      },
      { status: 500 }
    );
  }
}