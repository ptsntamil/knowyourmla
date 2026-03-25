import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/services/email.service";

export async function POST(request: NextRequest) {
  try {
    const { message, url } = await request.json();
    if (!message || !url) {
      return NextResponse.json({ error: "Missing message or url" }, { status: 400 });
    }

    const service = new EmailService();
    const success = await service.sendFeedback(message, url);
    
    if (success) {
      return NextResponse.json({ status: "ok" });
    } else {
      return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
