import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only superadmin can run this migration
    if (!user || user.role !== 'superadmin') {
      return Response.json({ error: 'Forbidden: Superadmin only' }, { status: 403 });
    }

    // Fetch all extras
    const extras = await base44.asServiceRole.entities.Extra.list();
    let updated = 0;

    for (const extra of extras) {
      let tag = '';

      if (extra.allowed_operators && extra.allowed_operators.length > 0) {
        // Tag with first operator name + extra ID
        const op = extra.allowed_operators[0];
        tag = `${op}_${extra.id}`;
      } else {
        // Global extra
        tag = `GLOBAL_${extra.id}`;
      }

      // Only update if tag is missing
      if (!extra.operator_tag) {
        await base44.asServiceRole.entities.Extra.update(extra.id, { operator_tag: tag });
        updated++;
      }
    }

    return Response.json({ 
      success: true, 
      message: `Tagged ${updated} existing extras with operator-specific identifiers`,
      total: extras.length,
      tagged: updated 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});