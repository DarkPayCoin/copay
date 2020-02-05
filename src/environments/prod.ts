import { EnvironmentSchema } from './schema';

/**
 * Environment: prod
 */
const env: EnvironmentSchema = {
  name: 'production',
  enableAnimations: true,
  ratesAPI: {
    btc: 'https://bitpay.com/api/rates',
    bch: 'https://bitpay.com/api/rates/bch',
    darkpay: 'https://api.coinpaprika.com/v1/ticker/d4rk-darkpay'
  },
  activateScanner: true
};

export default env;
