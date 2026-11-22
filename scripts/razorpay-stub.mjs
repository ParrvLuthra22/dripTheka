// A local Razorpay stand-in for end-to-end runs WITHOUT real test keys.
//   node scripts/razorpay-stub.mjs [port]      (default 4599)
//   then start the app with  RAZORPAY_API_BASE=http://127.0.0.1:4599 RAZORPAY_KEY_ID=rzp_test_stub RAZORPAY_KEY_SECRET=stub-secret
//        NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_stub
// POST /v1/orders → { id, amount }; GET /v1/orders/:id → a paid order (so /api/reserve/confirm and the webhook accept it).
// POST /__pay/:id marks an order paid=false/true ("?paid=0" leaves it unpaid, to test the confirming state).
import http from "node:http";

const port = Number(process.argv[2] ?? 4599);
const orders = new Map();
let seq = 0;
const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };

http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (req.method === "POST" && url.pathname === "/v1/orders") {
      const body = JSON.parse(raw || "{}");
      const o = { id: `order_stub_${Date.now().toString(36)}${++seq}`, amount: body.amount, amount_paid: body.amount, currency: "INR", status: "paid", receipt: body.receipt };
      orders.set(o.id, o);
      return json(res, 200, { id: o.id, amount: o.amount });
    }
    const m = url.pathname.match(/^\/v1\/orders\/([^/]+)$/);
    if (req.method === "GET" && m) {
      const o = orders.get(m[1]);
      return o ? json(res, 200, o) : json(res, 404, { error: { description: "not found" } });
    }
    const p = url.pathname.match(/^\/__pay\/([^/]+)$/);
    if (req.method === "POST" && p && orders.has(p[1])) {
      const o = orders.get(p[1]);
      const paid = url.searchParams.get("paid") !== "0";
      o.status = paid ? "paid" : "created"; o.amount_paid = paid ? o.amount : 0;
      return json(res, 200, o);
    }
    json(res, 404, { error: "stub: not handled" });
  });
}).listen(port, "127.0.0.1", () => console.log(`razorpay stub on :${port}`));
