import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock Resend — must match the shape used by route.ts ──────────────────────
const mockEmailsSend = vi.fn();

vi.mock("resend", () => ({
  // The Resend class is `new Resend(key)`, so we mock it as a class
  Resend: class MockResend {
    emails = { send: mockEmailsSend };
  },
}));

// ─── Import route AFTER mocking ────────────────────────────────────────────────
const { POST } = await import("@/app/api/notify-order/route");

// ─── Helpers ───────────────────────────────────────────────────────────────────
function makeRequest(body: object, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/notify-order", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/notify-order", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.RESEND_FROM_EMAIL = "noreply@example.com";
    process.env.RESEND_API_KEY = "re_test_key";
    delete process.env.API_NOTIFY_SECRET;
    mockEmailsSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 400 when orderId is missing", async () => {
    const req = makeRequest({ customerName: "Juan", total: 100 });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 200 and calls resend.emails.send on valid request", async () => {
    const req = makeRequest({
      orderId: "order-uuid-1234",
      customerName: "Juan Pérez",
      total: 350000,
      paymentMethod: "transfer",
      items: [{ name: "Baccarat Rouge 50ml", price: 350000, quantity: 1 }],
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(mockEmailsSend).toHaveBeenCalledOnce();
    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@example.com",
        from: "noreply@example.com",
        subject: expect.stringContaining("Juan Pérez"),
      })
    );
  });

  it("returns 401 when API_NOTIFY_SECRET is set but header is missing", async () => {
    process.env.API_NOTIFY_SECRET = "super-secret-key";
    const req = makeRequest({ orderId: "order-1" });
    const response = await POST(req);
    expect(response.status).toBe(401);
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it("returns 401 when API_NOTIFY_SECRET is set and header is wrong", async () => {
    process.env.API_NOTIFY_SECRET = "super-secret-key";
    const req = makeRequest({ orderId: "order-1" }, { "x-api-secret": "wrong-key" });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it("succeeds when API_NOTIFY_SECRET is set and header is correct", async () => {
    process.env.API_NOTIFY_SECRET = "super-secret-key";
    const req = makeRequest(
      { orderId: "order-uuid-1234", customerName: "Juan", total: 100, paymentMethod: "transfer", items: [] },
      { "x-api-secret": "super-secret-key" }
    );
    const response = await POST(req);
    expect(response.status).toBe(200);
  });

  it("returns 200 with skipped=true when ADMIN_EMAIL is not set", async () => {
    delete process.env.ADMIN_EMAIL;
    const req = makeRequest({
      orderId: "order-1",
      total: 100,
      customerName: "Juan",
      paymentMethod: "transfer",
      items: [],
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.skipped).toBe(true);
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it("returns 400 when Resend returns an error", async () => {
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "API key invalid" },
    });
    const req = makeRequest({
      orderId: "order-1",
      customerName: "Juan",
      total: 100,
      paymentMethod: "transfer",
      items: [],
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("includes all items in the email HTML", async () => {
    const req = makeRequest({
      orderId: "order-1",
      customerName: "Juan",
      total: 700000,
      paymentMethod: "transfer",
      items: [
        { name: "Baccarat Rouge 50ml", price: 350000, quantity: 1 },
        { name: "Creed Aventus 100ml", price: 350000, quantity: 1 },
      ],
    });
    await POST(req);
    const callArgs = mockEmailsSend.mock.calls[0][0];
    expect(callArgs.html).toContain("Baccarat Rouge 50ml");
    expect(callArgs.html).toContain("Creed Aventus 100ml");
  });
});
