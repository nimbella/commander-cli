const axios = require('axios');
const { getClientCreds, getUserCreds, setClientCreds } = require('../login');

const invokeCommand = async (command, body = {}) => {
  const { username, password, namespace } = await getUserCreds();
  const clientCreds = await getClientCreds();
  const gateway = 'https://apigcp.nimbella.io/api/v1/web/nc/portal/cli-gateway';

  const __ow_headers = {
    accept: 'application/json',
    'content-type': 'application/x-www-form-urlencoded',
  };

  const messageBody = {
    command: '/nc',
    team_domain: 'commander-cli',
    syncRequest: 'true',
    user_id: clientCreds.username,
    team_id: clientCreds.password,
    text: command,
    ...body,
  };

  if (command === 'register' && clientCreds.client === 'cli') {
    messageBody.misc = Object.assign({}, { namespace: namespace });
  }

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

const register = async () => {
  const { username, password } = await getUserCreds();
  await setClientCreds(username, password, 'cli');

  console.log("Please wait, we're registering your account with commander...");
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
  } else {
    console.log('done.');
  }

  const { username: user, client } = await getClientCreds();
  const { namespace } = await getUserCreds();
  console.log(`Your client: ${client} (${user.slice(0, 5)}...)`);
  console.log('Your namespace: ' + namespace);
};

module.exports = {
  invokeCommand,
  register,
};
