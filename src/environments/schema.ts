/**
 * Copay does not yet build with Angular CLI, but our environment system works
 * the same way.
 */
export interface EnvironmentSchema {
  name: 'production' | 'development' | 'e2e';
  enableAnimations: boolean;
  ratesAPI: {
    btc: string;
    bch: string;
    darkpay: string;
  };
  activateScanner: boolean;
}
