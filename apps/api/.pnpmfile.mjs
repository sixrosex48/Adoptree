export const hooks = {
  updateConfig(config) {
    config.verifyDepsBeforeRun = 'false';
    config.allowBuilds = { esbuild: true };
    return config;
  },
};
