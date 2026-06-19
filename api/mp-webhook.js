// Simple Mercado Pago webhook receiver

/** @type {(req: import('http').IncomingMessage & { method?: string, url?: string }, res: import('http').ServerResponse & { status: (n:number)=>any, json: (d:any)=>any, setHeader: (k:string,v:string)=>any }) => Promise<void>} */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Vercel Node runtime doesn't come with body parsed; we just log raw
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    console.log('MP Webhook:', req.method, req.url, raw);
  } catch (e) {
    console.log('MP Webhook read error:', e);
  }
  res.status(200).json({ ok: true });
};



