const chalk = require('chalk');
const shell = require('shelljs');
const { setClientCreds, determineClient } = require('../../login');
const { invokeCommand } = require('../../utils');
const error = msg => ({ attachments: [{ color: 'danger', text: msg }] });

module.exports = async args => {
  const [, token] = args;
  if (!token) {
    return {
      text:
        'Please provide valid arguments.\n ex: nim commander client login <cli_login_token>',
    };
  }

  const username = token.slice(0, token.lastIndexOf(':'));
  const password = token.slice(token.lastIndexOf(':') + 1);
  if (!username || !password) {
    return error(`Failed to extract login creds from: ${token}`);
  }

  const res = await invokeCommand('cli_login ' + token, token);
  if (!res.data || !res.data.text) {
    return error(`Failed to login using creds: ${token}`);
  }
  const cmd = shell.exec('nim auth login --auth ' + res.data.text);
  if (cmd.code) {
    return error(`Failed to login to the accountName`);
  }
  const accountName = shell
    .exec('nim auth current', { silent: true })
    .stdout.replace(/\r?\n|\r/g, ' ');
  const client = determineClient(token.trim());
  await setClientCreds({ accountName, username, password, client });
  return { text: 'Logged in successfully to ' + chalk.green(accountName) };
};
