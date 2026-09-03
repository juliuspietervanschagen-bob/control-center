export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  const { config } = await import("./src/config/env");
  if (!config.dashboardUseMock) return;
  const { dashboardIsReachable, startMockDashboard } = await import("./src/mock/dashboardServer");
  if (!(await dashboardIsReachable())) {
    startMockDashboard(config.dashboardMockPort);
  }
}
