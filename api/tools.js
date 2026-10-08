// /api/tools — the route the web app calls for calculations, bookings and lockers.
// Same handler as /api/mcp, kept separate so the browser never touches the MCP endpoint by name.
export { default } from './mcp.js';
