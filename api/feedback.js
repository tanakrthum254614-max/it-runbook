import { send, readBody } from '../lib/http.js';
import { save } from '../lib/store.js';
import { loadRunbooks } from './runbooks.js';

const FIELDS = { view: 'views', solved: 'solved', escalated: 'escalated' };

// นับยอดเปิดอ่าน / แก้ได้เอง / ต้องเปิด ticket เพื่อดูว่า runbook ไหนควรปรับปรุง
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const { id, action } = await readBody(req);
    const field = FIELDS[action];
    const list = await loadRunbooks();
    const rb = list.find((r) => r.id === id);
    if (!field || !rb) return send(res, 400, { error: 'ข้อมูลไม่ถูกต้อง' });
    rb[field] = (rb[field] || 0) + 1;
    await save('runbooks', list);
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
}
