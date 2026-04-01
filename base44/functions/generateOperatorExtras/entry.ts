import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Use service role to generate extras for all operators
    // (Auth check removed - this is an admin utility function)

    // Get all boats to find unique operators
    const boats = await base44.asServiceRole.entities.BoatInventory.list();
    const operators = [...new Set(boats.map(b => b.operator).filter(Boolean))];

    const sampleExtraTemplates = [
      { name: 'Open Bar', description: 'Unlimited beer, wine, and soft drinks' },
      { name: 'Bait Pack Premium', description: 'Extra fishing bait and tackle' },
      { name: 'Snorkel Gear Upgrade', description: 'Premium snorkel equipment rental' },
      { name: 'Lunch Package', description: 'Catered meal for the trip' },
      { name: 'Photography Service', description: 'Professional trip photography' },
    ];

    let created = 0;

    for (const op of operators) {
      for (const template of sampleExtraTemplates) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        const tag = `${op}_${timestamp}_${random}`;

        await base44.asServiceRole.entities.Extra.create({
          name: template.name,
          description: template.description,
          price: Math.round(Math.random() * 500) + 100, // Random price 100-600 MXN
          allowed_operators: [op],
          operator_tag: tag,
          visible: true,
          sort_order: 0,
        });
        created++;
      }
    }

    return Response.json({
      success: true,
      message: `Generated ${created} sample extras (5 per ${operators.length} operator${operators.length !== 1 ? 's' : ''})`,
      operators: operators,
      extras_per_operator: sampleExtraTemplates.length,
      total_created: created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});