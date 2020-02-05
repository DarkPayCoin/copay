import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import env from '../../environments';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class RateProvider {
  private rates;
  private alternatives;
  private ratesBCH;
  private ratesD4RK;
  private ratesBtcAvailable: boolean;
  private ratesBchAvailable: boolean;
  private ratesDarkpayAvailable: boolean;

  private SAT_TO_BTC: number;
  private BTC_TO_SAT: number;

  private rateServiceUrl = env.ratesAPI.btc;
  private bchRateServiceUrl = env.ratesAPI.bch;
  private darkpayRateServiceUrl = env.ratesAPI.darkpay;

  constructor(private http: HttpClient, private logger: Logger) {
    this.logger.debug('RateProvider initialized');
    this.rates = {};
    this.alternatives = [];
    this.ratesBCH = {};
    this.ratesD4RK = {};
    this.SAT_TO_BTC = 1 / 1e8;
    this.BTC_TO_SAT = 1e8;
    this.ratesBtcAvailable = false;
    this.ratesBchAvailable = false;
    this.updateRatesBtc();
    this.updateRatesBch();
    this.updateRatesDarkpay();
  }

  public updateRatesBtc(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBTC()
        .then(dataBTC => {
          _.each(dataBTC, currency => {
            this.rates[currency.code] = currency.rate;
            this.alternatives.push({
              name: currency.name,
              isoCode: currency.code,
              rate: currency.rate
            });
          });
          this.ratesBtcAvailable = true;
          resolve();
        })
        .catch(errorBTC => {
          this.logger.error(errorBTC);
          reject(errorBTC);
        });
    });
  }

  public updateRatesBch(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getBCH()
        .then(dataBCH => {
          _.each(dataBCH, currency => {
            this.ratesBCH[currency.code] = currency.rate;
          });
          this.ratesBchAvailable = true;
          resolve();
        })
        .catch(errorBCH => {
          this.logger.error(errorBCH);
          reject(errorBCH);
        });
    });
  }

  public updateRatesDarkpay(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getD4RK().then(dataD4RK => {
      // CMC  const rate_btc = dataD4RK[0].price_btc;
      // CPP
       const rate_btc = dataD4RK.price_btc;
        this.getBTC()
          .then(dataBTC => {
            _.each(dataBTC, currency => {
              this.ratesD4RK[currency.code] = currency.rate * rate_btc;
            });
            this.ratesDarkpayAvailable = true;
            resolve();
          })
          .catch(errorD4RK => {
            this.logger.error(errorD4RK);
            reject(errorD4RK);
          });
      });
    });
  }

  public getD4RK(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.darkpayRateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getBTC(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.rateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getBCH(): Promise<any> {
    return new Promise(resolve => {
      this.http.get(this.bchRateServiceUrl).subscribe(data => {
        resolve(data);
      });
    });
  }

  public getRate(code: string, chain?: string): number {
    if (chain == 'bch') return this.ratesBCH[code];
    if (chain == 'darkpay') return this.ratesD4RK[code];
    else return this.rates[code];
  }

  public getAlternatives() {
    return this.alternatives;
  }

  public isBtcAvailable() {
    return this.ratesBtcAvailable;
  }

  public isBchAvailable() {
    return this.ratesBchAvailable;
  }

  public isDarkpayAvailable() {
    return this.ratesDarkpayAvailable;
  }

  public toFiat(satoshis: number, code: string, chain: string): number {
    if (
      (!this.isBtcAvailable() && chain == 'btc') ||
      (!this.isBchAvailable() && chain == 'bch') ||
      (!this.isDarkpayAvailable() && chain == 'darkpay')
    ) {
      return null;
    }
    return satoshis * this.SAT_TO_BTC * this.getRate(code, chain);
  }

  public fromFiat(amount: number, code: string, chain: string): number {
    if (
      (!this.isBtcAvailable() && chain == 'btc') ||
      (!this.isBchAvailable() && chain == 'bch') ||
      (!this.isDarkpayAvailable() && chain == 'darkpay')
    ) {
      return null;
    }
    return (amount / this.getRate(code, chain)) * this.BTC_TO_SAT;
  }

  public listAlternatives(sort: boolean) {
    let alternatives = _.map(this.getAlternatives(), (item: any) => {
      return {
        name: item.name,
        isoCode: item.isoCode
      };
    });
    if (sort) {
      alternatives.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    }
    return _.uniqBy(alternatives, 'isoCode');
  }

  public whenRatesAvailable(chain: string): Promise<any> {
    return new Promise(resolve => {
      if (
        (this.ratesBtcAvailable && chain == 'btc') ||
        (this.ratesBchAvailable && chain == 'bch') ||
        (this.ratesDarkpayAvailable && chain == 'darkpay')
      )
        resolve();
      else {
        if (chain == 'btc') {
          this.updateRatesBtc().then(() => {
            resolve();
          });
        }
        if (chain == 'bch') {
          this.updateRatesBch().then(() => {
            resolve();
          });
        }
        if (chain == 'darkpay') {
          this.updateRatesDarkpay().then(() => {
            resolve();
          });
        }
      }
    });
  }
}