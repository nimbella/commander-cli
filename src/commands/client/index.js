const { getClientCreds } = require('../../login');

module.exports = async args => {
  if (args[0] === 'switch') {
    return await require('./switch')(args);
  } else if (args[0] === 'login') {
    return await require('./login')(args);
  } else {
    const currentClient = await getClientCreds();
    const output = [
      `Currently used credentials:`,
      `Account Name: ${currentClient.accountName}`,
      `Username: ${currentClient.username}`,
      `Client: ${currentClient.client}`,
      '', // Empty line
    ];

    return { text: output.join('\n') };
  }
};
