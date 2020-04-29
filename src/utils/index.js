const axios = require('axios');
const auth = require('../auth');
const {
  getClientCreds,
  getUserCreds,
  setUserCreds,
  setClientCreds,
  setActiveAccount,
} = require('../login');

const invokeCommand = async command => {
  const { username, password } = getUserCreds();
  const clientCreds = getClientCreds();
  const gateway =
    'https://apigcp.nimbella.io/api/v1/web/nc-dev/portal/cli-gateway';

  const __ow_headers = {
    accept: 'application/json',
    'content-type': 'application/x-www-form-urlencoded',
  };

  const messageBody = {
    command: '/nc',
    team_domain: 'commander-cli',
    syncRequest: 'true',
    user_id: clientCreds.user,
    team_id: clientCreds.password,
    text: command,
  };

  return await axios.post(gateway, messageBody, {
    headers: {
      'user-agent': 'commander-cli',
      __ow_headers,
      ...messageBody,
    },
    auth: {
      username,
      password,
    },
  });
};

const register = async interactive => {
  let secret = null;
  let ns = null;
  if (!interactive) {
    console.log('No account found. Please sign up on the Nimbella platform');
    process.exit(1);
  }
  const resp = await auth();
  if (resp.status !== 'success') {
    console.log('Failed to login to signup/login to your account');
    process.exit(1);
  }
  secret = [resp.uuid, resp.key];
  ns = resp.namespace;
  setClientCreds(secret[0], secret[1].trim(), 'cli');
  setUserCreds(secret[0], secret[1].trim(), ns);
  setActiveAccount(secret[0]);

  const res = await invokeCommand('register');
  const text = res.data.attachments
    ? res.data.attachments[0].text
    : res.data.text;
  if (
    !text.startsWith('Registered successfully with Commander') &&
    !text.startsWith("You've already registered with Commander")
  ) {
    console.log(text);
    console.log('Failed to register with Commander');
    process.exit(1);
  }

  const { user, client } = getClientCreds();
  console.log(`Your client: ${client} (${user.slice(0, 5)}...)`);
  console.log('Your namespace: ' + ns);
};

module.exports = {
  invokeCommand,
  register,
};
