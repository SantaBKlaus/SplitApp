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
      3. taxProfiles: an array of objects, each containing:
         - name: string (e.g., "GST", "VAT")
         - rate: number (percentage)
         - isGlobal: boolean (true if the tax appears in the summary section/bottom and applies to the subtotal, false if it's a line-item tax)
         - isDouble: boolean (true if the tax is a combination of CGST and SGST with the same rate. e.g., if receipt shows CGST 2.5% and SGST 2.5%, extract as ONE profile named "GST" with rate 2.5 and isDouble=true)
      4. currency: string (e.g., "USD", "INR", "EUR", "GBP", "JPY")

      IMPORTANT:
      - If you see CGST and SGST with the SAME rate (e.g. CGST 9% and SGST 9%), combine them into a SINGLE tax profile named "GST" with rate 9 and isDouble: true.
      - If they have different rates or appear alone, keep them separate with isDouble: false.
      - Ignore totals, subtotals, and balance due lines. Focus on individual line items.
      - If the image is not a receipt or unreadable, return an error field.
      - Return ONLY valid JSON, no markdown formatting.

      SPECIAL INSTRUCTIONS FOR UNSTRUCTURED/APP-GENERATED RECEIPTS:
      - If column headers (like "Item", "Price", "Qty") are MISSING, infer the structure based on placement:
        - Text on the LEFT is likely the Item Name.
        - Number on the RIGHT is likely the Price.
      - If Quantity is not explicitly stated, ASSUME Quantity = 1.
      - If a line shows "Item Name ... 500.00", treat "500.00" as the price and quantity as 1.
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
