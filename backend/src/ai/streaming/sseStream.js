/**
 * Server-Sent Events (SSE) Stream Controller
 */
export class SSEStreamHandler {
  /**
   * Initialize SSE headers on the Express response object
   */
  static initSSE(res) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable proxy buffering (Nginx)
    res.flushHeaders?.();
  }

  /**
   * Send a typed SSE event payload
   * @param {import('express').Response} res
   * @param {string} eventType - e.g. "status" | "token" | "action" | "done" | "error"
   * @param {any} data
   */
  static sendEvent(res, eventType, data) {
    if (res.writableEnded) return;
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${payload}\n\n`);
  }

  /**
   * Close the SSE stream gracefully
   */
  static closeStream(res) {
    if (!res.writableEnded) {
      this.sendEvent(res, "done", { status: "complete" });
      res.end();
    }
  }
}
