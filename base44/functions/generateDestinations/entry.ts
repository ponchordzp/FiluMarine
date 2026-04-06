import { createClientFromRequest } from 'npm:@base44/sdk@0.8.24';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const payload = await req.json();
        
        // Supports both webhook event payloads and direct test payloads
        const locationData = payload.data || payload; 
        
        if (!locationData || !locationData.location_id) {
             return Response.json({ success: false, message: 'No location data provided' });
        }
        
        const locationId = locationData.location_id;
        const locationName = locationData.name;
        
        const prompt = `
        Generate exactly 6 tourist destinations/points of interest for a boat or yacht trip in ${locationName}, Mexico.
        For each destination, provide:
        - A unique destination_id (URL-friendly string)
        - name (Display name)
        - location (A short location string)
        - coordinates (GPS coordinates)
        - summary (A nice 2-sentence summary)
        - activities (Array of 3-5 strings, like "Snorkeling", "Swimming")
        - images (Array of exactly 4 image URLs).
        
        CRITICAL FOR IMAGES: You MUST provide 4 valid, working image URLs.
        Use add_context_from_internet to find valid Unsplash photo IDs related to ${locationName}, beaches, or yachts.
        The URL format must be: https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&w=800&q=80
        If you cannot find real Unsplash IDs for this specific location, you MUST use a mix of these guaranteed working IDs:
        1499793983690-e29da59ef1c2
        1507525428034-b723cf961d3e
        1519046904884-53103b34b206
        1498698332559-450f7ce7a32b
        1500530855697-b586d8e0f112
        1515238152791-381dd00e12a6
        1475924156734-4981d3f9b177
        1464802686167-b939a6910659
        `;

        const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: true,
            model: 'gemini_3_1_pro',
            response_json_schema: {
                type: "object",
                properties: {
                    destinations: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                destination_id: { type: "string" },
                                name: { type: "string" },
                                location: { type: "string" },
                                coordinates: { type: "string" },
                                summary: { type: "string" },
                                activities: { type: "array", items: { type: "string" } },
                                images: { type: "array", items: { type: "string" } }
                            },
                            required: ["destination_id", "name", "location", "coordinates", "summary", "activities", "images"]
                        }
                    }
                },
                required: ["destinations"]
            }
        });
        
        const generatedDestinations = response.destinations;
        
        if (generatedDestinations && generatedDestinations.length > 0) {
            const recordsToInsert = generatedDestinations.map(d => ({
                ...d,
                region: locationId
            }));
            
            await base44.asServiceRole.entities.DestinationContent.bulkCreate(recordsToInsert);
        }
        
        return Response.json({ success: true, count: generatedDestinations?.length || 0, location: locationName });
    } catch (error) {
        console.error('Error generating destinations:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});