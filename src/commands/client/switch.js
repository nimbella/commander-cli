const { getClients, setCurrentClient } = require('../../credentials');
const { prompt } = require('inquirer');

module.exports = async () => {
  const clients = Object.values(await getClients());
  const choices = [];

  for (const client of clients) {
    choices.push({
      name: `${client.accountName} (${client.client})`,
      value: client,
    });
  }

  try {
    const { account } = await prompt([
      {
        type: 'list',
        name: 'account',
        message: 'Select the account:',
        choices: choices,
      },
    ]);

    await setCurrentClient(account.username);
    return {
      text: `Using ${account.accountName} now.`,
    };
  } catch (err) {
    return {
      text: err.message,
    };
  }
};
