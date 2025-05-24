import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import prisma from "@/lib/prisma";
import puppeteer from "puppeteer";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure params.id is available
    const { id } = await Promise.resolve(params);
    const exchangeId = parseInt(id);

    if (isNaN(exchangeId)) {
      return NextResponse.json(
        { error: "Invalid exchange ID" },
        { status: 400 }
      );
    }

    // Get the exchange request with related data
    const exchange: any = await prisma.wasteExchange.findUnique({
      where: { id: exchangeId },
      include: {
        textileWaste: {
          include: {
            companyProfile: true,
          },
        },
      },
    });

    if (!exchange) {
      return NextResponse.json(
        { error: "Exchange not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to access this receipt
    const userId =
      typeof session.user.id === "string"
        ? parseInt(session.user.id)
        : session.user.id;
    if (
      exchange.requester_id !== userId &&
      exchange.textileWaste.companyProfile.user_id !== userId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if exchange is accepted
    if (exchange.status !== "accepted") {
      return NextResponse.json(
        { error: "Receipt only available for accepted exchanges" },
        { status: 400 }
      );
    }

    // Load and encode the logo
    const logoPath = path.join(process.cwd(), "public", "green_logo.png");
    const logoBuffer = await fs.readFile(logoPath);
    const logoBase64 = logoBuffer.toString("base64");

    // Load and encode textile waste images
    const wasteImagesBase64: string[] = [];
    let images: Array<{ id: string; url: string; name?: string }> = [];

    try {
      if (exchange.textileWaste.images) {
        images = JSON.parse(exchange.textileWaste.images);
      }
    } catch (error) {
      console.error("Failed to parse image URLs:", error);
    }

    for (const image of images) {
      try {
        if (typeof image.url === "string") {
          const imagePath = path.join(process.cwd(), "public", image.url);
          const imageBuffer = await fs.readFile(imagePath);
          wasteImagesBase64.push(imageBuffer.toString("base64"));
        }
      } catch (error) {
        console.error(`Failed to load image: ${JSON.stringify(image)}`, error);
      }
    }

    // Add debug logging for price data
    console.log("Exchange data:", {
      price_per_unit: exchange.textileWaste.price_per_unit,
      quantity: exchange.quantity,
      total:
        Number(exchange.textileWaste.price_per_unit) *
        Number(exchange.quantity),
    });

    // Calculate total price based on textile waste price_per_unit
    const price_per_unit = Number(exchange.textileWaste.price_per_unit || 0);
    const quantity = Number(exchange.quantity || 0);
    const totalPrice = price_per_unit * quantity;

    // Create HTML content
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              margin: 20px;
              size: A4;
            }
            .logo {
              width: 100px;
              height: auto;
              margin: 0 auto;
            }
            .waste-images {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
              margin: 1rem 0;
            }
            .waste-image-container {
              position: relative;
              width: 100%;
              padding-bottom: 100%;
              background-color: #f3f4f6;
              border-radius: 0.5rem;
              overflow: hidden;
            }
            .waste-image {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .total-price {
              font-size: 1.75rem;
              font-weight: bold;
              color: #0D9488;
              text-align: right;
              padding: 0.75rem;
              border: 2px solid #0D9488;
              border-radius: 8px;
              margin-top: 0.75rem;
            }
          </style>
        </head>
        <body>
          <div class="min-h-screen bg-white p-6">
            <div class="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
              <div class="px-6 py-4">
                <div class="text-center mb-6">
                  <img src="data:image/png;base64,${logoBase64}" 
                  alt="TexTurn Hub Logo" 
                  class="logo mb-3"
                  />
                  <h1 class="text-2xl font-bold text-teal-600">TexTurn Hub</h1>
                  <h2 class="text-lg font-semibold text-gray-700 mt-1">Textile Waste Exchange Receipt</h2>
                </div>

                <div class="border-b pb-3 mb-4">
                  <p class="text-sm text-gray-600">Receipt ID: #${
                    exchange.id
                  }</p>
                  <p class="text-sm text-gray-600">Date: ${exchange.created_at.toLocaleDateString()}</p>
                </div>

                <div class="mb-4">
                  <h3 class="text-base font-semibold text-gray-800 mb-2">Exchange Details</h3>
                  <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-gray-700">Status: <span class="capitalize">${
                      exchange.status
                    }</span></p>
                    <p class="text-sm text-gray-700">Title: ${
                      exchange.textileWaste.title
                    }</p>
                    <p class="text-sm text-gray-700">Company: ${
                      exchange.textileWaste.companyProfile.company_name
                    }</p>
                    <p class="text-sm text-gray-700">Quantity: ${
                      exchange.quantity
                    }</p>
                    ${
                      exchange.city
                        ? `<p class="text-sm text-gray-700">City: ${exchange.city}</p>`
                        : ""
                    }
                  </div>
                </div>

                <div class="mb-4">
                  <h3 class="text-base font-semibold text-gray-800 mb-2">Location & Contact Details</h3>
                  <div class="bg-gray-50 p-3 rounded-lg">
                    <p class="text-sm text-gray-700">Company Location: ${
                      exchange.textileWaste.companyProfile.location ||
                      "Not specified"
                    }</p>
                    <p class="text-sm text-gray-700">Industry: ${
                      exchange.textileWaste.companyProfile.industry ||
                      "Not specified"
                    }</p>
                    ${
                      exchange.textileWaste.companyProfile.website
                        ? `<p class="text-sm text-gray-700">Website: ${exchange.textileWaste.companyProfile.website}</p>`
                        : ""
                    }
                  </div>
                </div>

                ${
                  typeof exchange.textileWaste.price_per_unit !== "undefined" &&
                  exchange.textileWaste.price_per_unit !== null
                    ? `
                    <div class="mb-4">
                      <h3 class="text-base font-semibold text-gray-800 mb-2">Payment Details</h3>
                      <div class="bg-gray-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-700">Price per unit: $${price_per_unit.toFixed(
                          2
                        )} / ${exchange.textileWaste.unit}</p>
                        <p class="text-sm text-gray-700">Quantity: ${
                          exchange.quantity
                        } ${exchange.textileWaste.unit}</p>
                        <div class="total-price">
                          Total: $${totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  `
                    : `
                    <div class="mb-4">
                      <div class="bg-gray-50 p-3 rounded-lg">
                        <p class="text-sm text-gray-700 text-center">No price information available</p>
                      </div>
                    </div>
                  `
                }

                <div class="text-center text-gray-500 text-xs mt-6 pt-3 border-t">
                  <p>This is an official receipt for the textile waste exchange transaction.</p>
                  <p class="mt-1">Generated by TexTurn Hub on ${new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Launch Puppeteer with larger viewport for better image quality
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2,
    });

    try {
      // Set content and wait for all resources to load
      await page.setContent(html, {
        waitUntil: ["load", "networkidle0", "domcontentloaded"],
      });

      // Wait for images with a more generous timeout
      await page.waitForSelector("img", { timeout: 10000 }).catch(() => {
        console.log("Waited for images, continuing...");
      });

      // Additional wait to ensure everything is rendered
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate PDF with better quality
      const pdf = await page.pdf({
        format: "A4",
        margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
        printBackground: true,
        preferCSSPageSize: true,
      });

      // Close browser before sending response
      await browser.close();

      // Create response with proper headers
      const response = new NextResponse(pdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=exchange-receipt-${exchange.id}.pdf`,
          "Cache-Control": "no-cache",
        },
      });

      return response;
    } catch (error) {
      // Make sure to close the browser in case of error
      if (browser) {
        await browser.close().catch(console.error);
      }

      console.error("Error generating receipt:", error);

      // Return error response
      return new NextResponse(
        JSON.stringify({ error: "Failed to generate receipt" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (outerError) {
    console.error("Outer error:", outerError);
    return new NextResponse(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
