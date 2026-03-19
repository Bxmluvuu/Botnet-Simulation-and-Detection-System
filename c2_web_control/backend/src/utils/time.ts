export class TimeUtil {
  static nowIso(): string {
    return new Date().toISOString();
  }
}
