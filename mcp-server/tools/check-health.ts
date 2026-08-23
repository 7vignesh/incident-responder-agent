export interface HealthResult {
  reachable: boolean;
  statusCode?: number;
  body?: unknown;
  error?: string;
}

export async function checkHealth(port: number = 3001): Promise<HealthResult> {
  try {
    const res = await fetch(`http://localhost:${port}/health`);
    const body = await res.json();
    return { reachable: true, statusCode: res.status, body };
  } catch (err: any) {
    return { reachable: false, error: err.message };
  }
}

export async function checkCheckout(port: number = 3001): Promise<HealthResult> {
  try {
    const res = await fetch(`http://localhost:${port}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: 1, qty: 1 }] }),
    });
    const body = await res.json();
    return { reachable: true, statusCode: res.status, body };
  } catch (err: any) {
    return { reachable: false, error: err.message };
  }
}
