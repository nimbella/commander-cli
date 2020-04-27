const path = require('path');
const os = require('os');
const Conf = require('conf');

module.exports = new Conf({
  configName: 'account',
  fileExtension: 'json',
  projectSuffix: '',
  cwd: path.join(os.homedir(), '.commander'),
  serialize: value => JSON.stringify(value, null, 2),
  defaults: {
    accounts: {
      active: 'none',
      platform: {
        user: 'platform-1',
        password: 'password',
        namespace: 'namespace-id',
      },
      clients: {},
    },
  },
  projectName: 'commander-cli',
});
