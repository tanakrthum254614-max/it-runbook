<div align="center">

<img src="docs/banner.svg" alt="IT Runbook" width="100%">

<br>

<img src="https://img.shields.io/badge/Node.js-20%2B-3c873a?logo=nodedotjs&logoColor=white" alt="Node.js"> <img src="https://img.shields.io/badge/Vercel-serverless-000?logo=vercel&logoColor=white" alt="Vercel"> <img src="https://img.shields.io/badge/Upstash-Redis-00e9a3?logo=upstash&logoColor=white" alt="Upstash"> <img src="https://img.shields.io/badge/UI-Thai-d4af5f?labelColor=0a0a0c" alt="Thai UI">

</div>

<table>
<tr>
<td width="72%"><img src="docs/screenshot.png" alt="IT Runbook — desktop"></td>
<td width="28%"><img src="docs/screenshot-phone.png" alt="IT Runbook — mobile"></td>
</tr>
<tr><td align="center"><sub>คอมพิวเตอร์ (ข้อมูลตัวอย่าง)</sub></td><td align="center"><sub>มือถือ</sub></td></tr>
</table>

หน้าเว็บรวมวิธีแก้ปัญหา IT ที่เจอบ่อย ให้ user ลองแก้เองก่อนเปิด ticket
ช่วยลดงานซ้ำ ๆ ของ helpdesk เช่นเครื่องปริ้นท์ค้าง, VPN ต่อไม่ได้ หรือลืมรหัสผ่าน

## ความสามารถ
- **ค้นหาด้วยภาษาคน** เช่นพิมพ์ “ปริ้นไม่ออก” หรือ “vpn” ก็เจอ (ค้นทั้งหัวข้อ, คำค้น, อาการ และขั้นตอน)
- **ขั้นตอนแบบติ๊กได้**: แตะเพื่อติ๊กว่าทำขั้นไหนไปแล้ว
- **ปุ่ม “แก้ได้แล้ว / ยังไม่หาย”**: ถ้ายังไม่หาย จะบอกว่าต้องแนบอะไรมา แล้วพาไปหน้าเปิด ticket
- **สถิติสำหรับแอดมิน**: runbook ไหนที่ user ทำตามแล้วยังไม่หาย (ควรปรับปรุง) และช่วยลด ticket ไปได้กี่ครั้ง
  ตัวเลขนี้เอาไปรายงานหัวหน้าได้เลย
- มีตัวอย่างให้ 7 เรื่อง แก้ไขหรือเพิ่มได้จากหน้าเว็บในโหมดแอดมิน (ปุ่มอยู่ท้ายหน้า)

## รันในเครื่อง
```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:3000
```

## Deploy ขึ้น Vercel
1. Push ขึ้น GitHub แล้ว Import เข้า Vercel
2. Storage → เพิ่ม **Upstash Redis** (ฟรี)
3. ตั้ง `ADMIN_KEY`, `ORG_NAME`, `TICKET_URL` และ `IT_CONTACT`

---

<div align="center"><sub>ชุดเครื่องมือ IT เดียวกัน: [⏰ IT Expiry Alert](https://github.com/tanakrthum254614-max/it-expiry-alert) · [💻 IT Asset Tracker](https://github.com/tanakrthum254614-max/it-asset-tracker) · โดย <a href="https://github.com/tanakrthum254614-max">tanakrthum254614-max</a> 🇹🇭</sub></div>
