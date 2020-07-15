const chalk = require('chalk');
const { setClientCreds, determineClient } = require('../../login');
const error = msg => ({ attachments: [{ color: 'danger', text: msg }] });

module.exports = async args => {
  const [, accountName, token] = args;
  if (!accountName || !token) {
    return {
      text:
        'Please provide valid arguments.\n ex: nim commander client add <workspace_name> <cli_login_token>',
    };
  }

  const username = token.slice(0, token.lastIndexOf(':'));
  const password = token.slice(token.lastIndexOf(':') + 1);
  if (!username || !password) {
    return error(`Failed to extract login creds from: ${token}`);
  }

  const client = determineClient(token.trim());
  await setClientCreds({ accountName, username, password, client });
  return { text: 'Logged in successfully to ' + chalk.green(accountName) };
};
