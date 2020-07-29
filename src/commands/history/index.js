const { join } = require('path');
const { nimbellaDir } = require('nimbella-cli/lib/deployer/credentials');

module.exports = async () => {
  const historyFile = join(
    nimbellaDir(),
    'inquirer-command-prompt-history.json'
  );

  // Delete cache
  delete require.cache[historyFile];
  const { histories } = require(historyFile);

  return { text: histories._default.join('\n') };
};
