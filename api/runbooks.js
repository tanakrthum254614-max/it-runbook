import { send, readBody, query, denyUnlessAdmin, uid } from '../lib/http.js';
import { load, save } from '../lib/store.js';
import { SEED } from '../lib/seed.js';

export async function loadRunbooks() {
  const list = await load('runbooks', null);
  if (list) return list;
  // id คงที่ เพื่อให้ feedback ก่อนบันทึกครั้งแรกชี้ไปที่รายการเดียวกัน
  return SEED.map((r, i) => ({ id: `seed${i + 1}`, ...r, views: 0, solved: 0, escalated: 0, updatedAt: null }));
}

const clean = (s, max = 5000) => String(s ?? '').trim().slice(0, max);

// GET อ่านได้ทุกคน, POST/DELETE ต้องเป็นแอดมิน
export default async function handler(req, res) {
  try {
    const list = await loadRunbooks();

    if (req.method === 'GET') return send(res, 200, { runbooks: list });
    if (denyUnlessAdmin(req, res)) return;

    if (req.method === 'POST') {
      const input = await readBody(req);
      const title = clean(input.title, 200);
      const steps = clean(input.steps);
      if (!title || !steps) return send(res, 400, { error: 'กรุณาใส่หัวข้อและขั้นตอน' });

      let rb = list.find((r) => r.id === input.id);
      if (!rb) list.unshift((rb = { id: uid(), views: 0, solved: 0, escalated: 0 }));
      Object.assign(rb, {
        title, steps,
        category: clean(input.category, 100) || 'อื่น ๆ',
        tags: (Array.isArray(input.tags) ? input.tags : String(input.tags || '').split(','))
          .map((t) => clean(t, 50)).filter(Boolean),
        symptoms: clean(input.symptoms, 1000),
        escalate: clean(input.escalate, 1000),
        updatedAt: new Date().toISOString(),
      });
      await save('runbooks', list);
      return send(res, 200, { runbook: rb });
    }

    if (req.method === 'DELETE') {
      const { id } = query(req);
      await save('runbooks', list.filter((r) => r.id !== id));
      return send(res, 200, { ok: true });
    }

    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
