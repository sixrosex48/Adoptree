export const hooks = {
  updateConfig(config) {
    config.verifyDepsBeforeRun = 'false';
    return config;
  },
};
