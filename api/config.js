import { send } from '../lib/http.js';

export default function handler(req, res) {
  send(res, 200, {
    orgName: process.env.ORG_NAME || 'IT Helpdesk',
    ticketUrl: process.env.TICKET_URL || '',
    contact: process.env.IT_CONTACT || '',
  });
}
