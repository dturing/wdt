import { Config } from '@stencil/core';

// https://stenciljs.com/docs/config

export const config: Config = {
  globalStyle: 'src/global/app.css',
  globalScript: 'src/global/app.ts',
  outputTargets: [
    {
      type: 'www',
      dir: 'wdt',
      // uncomment the following line to disable service workers in production
      //serviceWorker: null
    }
  ],
  devServer: {
  	openBrowser: false
  }
};
