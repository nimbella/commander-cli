const Conf = require('conf');
const config = new Conf({
  defaults: {
    userID: 'ucommandercli',
    teamID: 'tcommandercli',
  },
  projectName: 'commander-cli',
});

module.exports = config;
