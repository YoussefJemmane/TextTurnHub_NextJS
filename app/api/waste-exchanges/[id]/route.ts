import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import prisma from "@/lib/prisma";
import axios from "axios";

interface Params {
  params: Promise<{ id: string }>; // Changed to Promise
}

const ORS_API_KEY = process.env.ORS_API_KEY;
const wasteFactors: Record<string, number> = {
  organic: 1.2,
  synthetic: 1.1,
  mixed: 1.3,
  recyclable: 0.9,
};
const modeFactors: Record<string, number> = {
  truck: 0.05,
  ship: 0.03,
  air: 0.18,
};

async function getDistanceKm(
  fromCity: string,
  toCity: string
): Promise<number | null> {
  try {
    // Geocode both cities
    const geocode = async (city: string) => {
      const res = await axios.get(
        "https://api.openrouteservice.org/geocode/search",
        {
          params: { api_key: ORS_API_KEY, text: city },
        }
      );
      return res.data.features[0].geometry.coordinates; // [lng, lat]
    };
    const fromCoords = await geocode(fromCity);
    const toCoords = await geocode(toCity);
    // Get route distance
    const res = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      { coordinates: [fromCoords, toCoords] },
      { headers: { Authorization: ORS_API_KEY } }
    );
    const distanceMeters = res.data.features[0].properties.summary.distance;
    return distanceMeters / 1000;
  } catch (e) {
    return null;
  }
}

// GET /api/waste-exchanges/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const resolvedParams = await params; // Await params before accessing properties
    const exchangeId = parseInt(resolvedParams.id);

    // Get waste exchange with textile waste and company details
    const wasteExchange = await prisma.wasteExchange.findUnique({
      where: { id: exchangeId },
      include: {
        textileWaste: {
          include: {
            companyProfile: {
              select: {
                id: true,
                company_name: true,
                user_id: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!wasteExchange) {
      return NextResponse.json(
        { error: "Waste exchange not found" },
        { status: 404 }
      );
    }

    // Check if user is involved in this exchange (as requester or company owner)
    const isRequester = wasteExchange.requester_id === userId; // Fixed: removed toString()
    const isCompanyOwner =
      wasteExchange.textileWaste.companyProfile.user_id === userId;

    if (
      !isRequester &&
      !isCompanyOwner &&
      !session.user.roles?.includes("admin") // Added optional chaining
    ) {
      return NextResponse.json(
        { error: "Forbidden: You're not involved in this exchange" },
        { status: 403 }
      );
    }

    // --- Enhanced Carbon Calculation ---
    let carbon_savings = null;
    let carbon_details = null;
    const fromCity = (wasteExchange as any).city;
    const toCity = wasteExchange.textileWaste.companyProfile.location;
    if (
      typeof fromCity === "string" &&
      typeof toCity === "string" &&
      fromCity.length > 0 &&
      toCity.length > 0 &&
      wasteExchange.quantity
    ) {
      const distanceKm = await getDistanceKm(fromCity, toCity);
      // Use mode and wasteType if present, else fallback
      const mode = (wasteExchange as any).mode || "truck";
      const wasteType = (wasteExchange as any).wasteType || "organic";
      const wasteFactor = wasteFactors[wasteType] || 1.0;
      const modeFactor = modeFactors[mode] || 0.05;
      const weight = Number(wasteExchange.quantity);
      if (distanceKm !== null) {
        carbon_savings = weight * distanceKm * wasteFactor * modeFactor;
        carbon_details = {
          weight,
          fromCity,
          toCity,
          distanceKm,
          wasteType,
          wasteFactor,
          mode,
          modeFactor,
          formula: "weight * distanceKm * wasteFactor * modeFactor",
          result: carbon_savings,
        };
      }
    }

    return NextResponse.json({
      wasteExchange: { ...wasteExchange, carbon_savings, carbon_details },
    });
  } catch (error) {
    console.error("Error fetching waste exchange:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/waste-exchanges/[id]/accept
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const resolvedParams = await params; // Await params before accessing properties
    const exchangeId = parseInt(resolvedParams.id);
    const { action, response_message, price } = await request.json();

    // Get waste exchange
    const wasteExchange = await prisma.wasteExchange.findUnique({
      where: { id: exchangeId },
      include: {
        textileWaste: {
          include: {
            companyProfile: true,
          },
        },
      },
    });

    if (!wasteExchange) {
      return NextResponse.json(
        { error: "Waste exchange not found" },
        { status: 404 }
      );
    }

    // Validate the action
    const validActions = ["accept", "reject", "complete", "cancel"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Check permissions for each action
    const isRequester = wasteExchange.requester_id === userId; // Fixed: removed toString()
    const isCompanyOwner =
      wasteExchange.textileWaste.companyProfile.user_id === userId;

    if (action === "accept" || action === "reject") {
      // Only company owner can accept/reject
      if (!isCompanyOwner) {
        return NextResponse.json(
          { error: "Forbidden: Only the company owner can accept or reject" },
          { status: 403 }
        );
      }

      // Can only accept/reject pending exchanges
      if (wasteExchange.status !== "pending") {
        return NextResponse.json(
          { error: `Cannot ${action} an exchange that is not pending` },
          { status: 400 }
        );
      }
    } else if (action === "complete") {
      // Both parties can mark as complete
      if (!isCompanyOwner && !isRequester) {
        return NextResponse.json(
          {
            error: "Forbidden: Only involved parties can complete the exchange",
          },
          { status: 403 }
        );
      }

      // Can only complete accepted exchanges
      if (wasteExchange.status !== "accepted") {
        return NextResponse.json(
          { error: "Cannot complete an exchange that is not accepted" },
          { status: 400 }
        );
      }
    } else if (action === "cancel") {
      // Both parties can cancel
      if (!isCompanyOwner && !isRequester) {
        return NextResponse.json(
          { error: "Forbidden: Only involved parties can cancel the exchange" },
          { status: 403 }
        );
      }

      // Can only cancel pending or accepted exchanges
      if (
        wasteExchange.status !== "pending" &&
        wasteExchange.status !== "accepted"
      ) {
        return NextResponse.json(
          {
            error:
              "Cannot cancel an exchange that is already completed or rejected",
          },
          { status: 400 }
        );
      }
    }

    // Update the waste exchange status
    const updatedExchange = await prisma.wasteExchange.update({
      where: { id: exchangeId },
      data: {
        status:
          action === "accept"
            ? "accepted"
            : action === "reject"
            ? "rejected"
            : action === "complete"
            ? "completed"
            : "cancelled",
        response_message: response_message || wasteExchange.response_message,
        price: price || wasteExchange.price,
        exchange_date:
          action === "complete" ? new Date() : wasteExchange.exchange_date,
      },
    });

    // If completing the exchange, update the textile waste quantity and status if necessary
    if (action === "complete") {
      const newQuantity =
        Number(wasteExchange.textileWaste.quantity) -
        Number(wasteExchange.quantity);

      await prisma.textileWaste.update({
        where: { id: wasteExchange.textile_waste_id },
        data: {
          quantity: newQuantity,
          availability_status: newQuantity <= 0 ? "sold_out" : "available",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Waste exchange ${action}ed successfully`,
      wasteExchange: updatedExchange,
    });
  } catch (error) {
    console.error(`Error updating waste exchange:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}