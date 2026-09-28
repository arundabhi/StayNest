import { AIObservabilityLog } from "./observability.model.js";

export class ObservabilityService {
  /**
   * Log an AI transaction asynchronously
   */
  async logTransaction({
    sessionId,
    userId = null,
    query,
    intent,
    agentUsed,
    resolvedBy = "agent",
    toolsUsed = [],
    latencyMs,
    tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    success = true,
    errorMessage = null,
    stateSnapshot = {},
  }) {
    try {
      await AIObservabilityLog.create({
        sessionId,
        userId: userId || undefined,
        query,
        intent,
        agentUsed,
        resolvedBy,
        toolsUsed,
        latencyMs: Math.round(latencyMs),
        tokenUsage,
        success,
        errorMessage,
        stateSnapshot,
      });
    } catch (err) {
      console.error("[OBSERVABILITY] Failed to record log:", err.message);
    }
  }

  /**
   * Get analytics dashboard metrics for AI performance
   */
  async getDashboardMetrics(days = 7) {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [summary, intentBreakdown, latencyP95] = await Promise.all([
        // Total queries & success rate
        AIObservabilityLog.aggregate([
          { $match: { createdAt: { $gte: sinceDate } } },
          {
            $group: {
              _id: null,
              totalQueries: { $sum: 1 },
              successfulQueries: { $sum: { $cond: ["$success", 1, 0] } },
              avgLatencyMs: { $avg: "$latencyMs" },
              totalTokens: { $sum: "$tokenUsage.totalTokens" },
            },
          },
        ]),

        // Breakdown by intent
        AIObservabilityLog.aggregate([
          { $match: { createdAt: { $gte: sinceDate } } },
          {
            $group: {
              _id: "$intent",
              count: { $sum: 1 },
              avgLatency: { $avg: "$latencyMs" },
            },
          },
          { $sort: { count: -1 } },
        ]),

        // Latency percentiles
        AIObservabilityLog.aggregate([
          { $match: { createdAt: { $gte: sinceDate } } },
          {
            $group: {
              _id: null,
              latencies: { $push: "$latencyMs" },
            },
          },
        ]),
      ]);

      const baseStats = summary[0] || {
        totalQueries: 0,
        successfulQueries: 0,
        avgLatencyMs: 0,
        totalTokens: 0,
      };

      let p95Latency = 0;
      if (latencyP95[0]?.latencies?.length) {
        const sorted = latencyP95[0].latencies.sort((a, b) => a - b);
        const index = Math.floor(sorted.length * 0.95);
        p95Latency = sorted[index] || 0;
      }

      return {
        timeWindowDays: days,
        totalQueries: baseStats.totalQueries,
        successRatePercent: baseStats.totalQueries
          ? Math.round((baseStats.successfulQueries / baseStats.totalQueries) * 100)
          : 100,
        avgLatencyMs: Math.round(baseStats.avgLatencyMs),
        p95LatencyMs: Math.round(p95Latency),
        totalTokensConsumed: baseStats.totalTokens,
        intentDistribution: intentBreakdown,
      };
    } catch (error) {
      console.error("[OBSERVABILITY] Metric aggregation error:", error);
      return { error: error.message };
    }
  }
}

export const observabilityService = new ObservabilityService();
