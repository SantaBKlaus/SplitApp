import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
        }

        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash for speed and cost-effectiveness. 
        // Can be swapped to 'gemini-1.5-pro' for higher reasoning capabilities if needed.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      1. items: an array of objects, each containing:
         - name: string (item name, keep it concise)
         - price: number (price per unit)
         - quantity: number (default to 1 if not specified)
      2. serviceTax: number (percentage, if found, else 0)
      3. currency: string (e.g., "USD", "INR", "EUR", "GBP", "JPY")

      Ignore totals, subtotals, and balance due lines. Focus on individual line items.
      If the image is not a receipt or unreadable, return an error field.
      Return ONLY valid JSON, no markdown formatting.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present (Gemini sometimes adds them)
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const data = JSON.parse(jsonStr);
            return NextResponse.json(data);
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            return NextResponse.json({ error: "Failed to parse receipt data" }, { status: 500 });
        }

    } catch (error) {
        console.error("Error scanning receipt:", error);
        return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
    }
}
