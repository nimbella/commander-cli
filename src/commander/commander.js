/*
 * Nimbella CONFIDENTIAL
 * ---------------------
 *
 *   2018 - present Nimbella Corp
 *   All Rights Reserved.
 *
 * NOTICE:
 *
 * All information contained herein is, and remains the property of
 * Nimbella Corp and its suppliers, if any.  The intellectual and technical
 * concepts contained herein are proprietary to Nimbella Corp and its
 * suppliers and may be covered by U.S. and Foreign Patents, patents
 * in process, and are protected by trade secret or copyright law.
 *
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Nimbella Corp.
 */

const shell = require('shelljs');
const chalk = require('chalk');
const figlet = require('figlet');
const open = require('open');
const terminalLink = require('terminal-link');
const inquirer = require('inquirer');
const inquirerCommandPrompt = require('inquirer-command-prompt');
const { NimBaseCommand } = require('nimbella-cli/lib/NimBaseCommand');
const { nimbellaDir } = require('nimbella-cli/lib/deployer/credentials');

const login = require('../login');
const renderResult = require('../render');
const { replCommands, commanderCommands } = require('../utils/commands');
const { invokeCommand, register } = require('../utils');
const commands = require('../commands');

inquirerCommandPrompt.setConfig({
  history: {
    save: true,
    folder: nimbellaDir(),
    limit: 20,
  },
});
inquirer.registerPrompt('command', inquirerCommandPrompt);

const init = async () => {
  console.log(
    chalk.green(
      figlet.textSync('Commander CLI', {
        horizontalLayout: 'default',
        verticalLayout: 'default',
      })
    )
  );
  console.log(
    'CLI which allows you to create, run & publish your serverless functions as commands\n'
  );
  const nimbella = terminalLink(
    'Presented to you by Nimbella\n',
    'https://nimbella.com'
  );
  console.log(nimbella);

  if (await login.isFirstLogin()) {
    await register(true);
  } else {
    const { username, client } = await login.getClientCreds();

    console.log(
      `Your client: ${chalk.bold(client)} (${username.slice(
        0,
        10
      )}...)\nYour namespace: ${(await login.getUserCreds()).namespace}`
    );
  }
};

const getHelp = () => {
  const helpOutput = [
    `${chalk.bold('Commander CLI')}`,
    `A CLI to interact with Commander from your terminal.`,
    '', // Empty line
    `${chalk.bold('USAGE')}`,
    `$ ${chalk.green('nim commander')} - launch Commander REPL`,
    `$ ${chalk.green('nim commander help')} - display help for Commander CLI.`,
    `$ ${chalk.green(
      'nim commander <command> [command_params/command_options]'
    )} - run commander commands`,
    '', // Empty line
    `${chalk.bold('REPL Commands')}`,
    `${chalk.green('.exit')} - exit the repl`,
    `${chalk.green('.clear')} - clear the repl`,
    `${chalk.green('.help')} - display help in repl`,
    '', // Empty line
    `${chalk.bold('Commander Commands')}`,
    `${chalk.green(
      'command_create <command> [<parameters>] ...'
    )} - Creates a command & opens online source editor`,
    `${chalk.green(
      'csm_install <command-set> ...'
    )} - Install from Nimbella Command Set Registry: https://github.com/nimbella/command-sets`,
    '', // Empty line
    `Please refer https://nimbella.com/resources-commander/reference to learn about Commander commands.`,
  ];

  return helpOutput.join('\n');
};

const commanderHelp = [
  {
    name: 'What is Commander, what can I do with it?',
    value:
      'https://nimbella.com/resources-commander/overview#what-is-commander',
  },
  {
    name: 'Commander command reference',
    value:
      'https://nimbella.com/resources-commander/reference#command-reference',
  },
  {
    name: 'Creating and deploying custom commands',
    value: 'https://www.youtube.com/watch?v=HxaLII_IGzY',
  },
  {
    name: 'What are Command-sets and how do I build them?',
    value: 'https://github.com/nimbella/command-sets',
  },
  {
    name: 'Quick start on using Commander',
    value: 'https://nimbella.com/resources-commander/quickstart#quickstart',
  },
];

const twirlTimer = () => {
  const patterns = ['\\', '|', '/', '-'];
  var x = 0;
  return setInterval(() => {
    process.stdout.write('\r' + patterns[x++]);
    x &= 3;
  }, 250);
};

const runCommand = async command => {
  let loader = null;
  const args = command
    .trim()
    .split(/\s/)
    .filter(value => value !== '')
    // Remove the command to return only args
    .slice(1);

  try {
    if (command === '?' || command === 'help') {
      getHelp(command);
      return null;
    }

    if (command.startsWith('login')) {
      return login.login(args);
    }

    if (command === 'workbench') {
      open(login.getWorkbenchURL());
      return null;
    }

    if (command.startsWith('command_set')) {
      return commands.commandSet(args);
    }

    if (command.startsWith('/nc')) {
      command = command.substring(command.indexOf(' ') + 1);
    } else if (command.startsWith('nim') && shell.which('nim')) {
      shell.exec(command);
      return null;
    }

    if (command.startsWith('app_add') || command.startsWith('app_delete')) {
      return {
        text: 'Sorry app addition/deletion is not supported in the cli mode',
      };
    }

    loader = twirlTimer();
    const res = await invokeCommand(command);
    clearInterval(loader);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);

    if (res.status !== 200) {
      return {
        attachments: [
          {
            color: 'danger',
            text: res.data.error || res.statusText,
          },
        ],
      };
    }

    // Check if text is JSON.
    if (res.data.text && res.data.text.startsWith('{')) {
      const data = JSON.parse(res.data.text);

      console.log(JSON.stringify(data, null, 2));
      console.log(`\nYou can invoke the command using cURL:\n`);

      const { params, __secrets, commandText } = data;
      console.log(
        `curl -H "Content-Type: application/json" --user "${data.auth[0]}:${
          data.auth[1]
        }" --data '${JSON.stringify({
          params,
          __secrets,
          commandText,
        })}' -X POST ${data.url}`
      );

      return '';
    }

    return res.data;
  } catch (error) {
    if (loader) {
      clearInterval(loader);
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    }
    return {
      attachments: [
        {
          color: 'danger',
          text: error.message,
        },
      ],
    };
  }
};

async function getCommand() {
  const { command } = await inquirer.prompt([
    {
      type: 'command',
      name: 'command',
      message: 'nc>',
      autoCompletion: line => {
        if (line.startsWith('/nc')) {
          const modified = [];
          for (let i = 0; i < commanderCommands.length; i++) {
            modified[i] = '/nc ' + commanderCommands[i];
          }
          return modified;
        }

        if (line.startsWith('nc')) {
          const modified = [];
          for (let i = 0; i < commanderCommands.length; i++) {
            modified[i] = 'nc ' + commanderCommands[i];
          }
          return modified;
        }

        return [...replCommands, ...commanderCommands];
      },
    },
  ]);

  return command;
}

async function main(args) {
  if (args.length > 0) {
    if (['help', '--help', '-h'].includes(args[0])) {
      console.log(getHelp());
      process.exit();
    } else {
      if (await login.isFirstLogin()) {
        await register(false);
      }
      const result = await runCommand(args.join(' '));
      console.log(renderResult(result));
    }
  } else {
    await init();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const command = await getCommand();
      switch (command) {
        case '.exit':
          process.exit();
          break;
        case '':
          continue;
        case '.clear':
          console.clear();
          break;
        case '.help':
        case '?':
          console.log(getHelp());
          break;
        case 'help': {
          const { link } = await inquirer.prompt({
            type: 'list',
            name: 'link',
            message: 'Commander Help (Opens in browser)',
            choices: [...commanderHelp, { name: 'Exit prompt', value: 'exit' }],
          });

          if (link === 'exit') {
            continue;
          } else {
            await open(link);
          }
          break;
        }
        default: {
          const result = await runCommand(command);

          if (
            result !== null &&
            result.attachments &&
            result.attachments[0].color === 'danger'
          ) {
            const output = renderResult(result);
            console.log(output);
            continue;
          }

          const browserDependentCommands = [
            'command_create',
            'command_code',
            'secret_create',
          ];

          if (browserDependentCommands.includes(command.split(/\s/)[0])) {
            const link = result.text.match(/<(.+)\|(.+)>/)[1];
            if (link) {
              console.log('Opening your default browser...');
              await open(link);
            }
          } else {
            const output = renderResult(result);
            console.log(output);
          }
          break;
        }
      }
    }
  }
}

class Commander extends NimBaseCommand {
  async run() {
    try {
      const { argv } = this.parse(Commander);
      await main(argv);
    } catch (error) {
      console.log(`nc> ${error.stack}`);
    }
  }
}

Commander.strict = false;
Commander.description = `interact with Nimbella Commander`;

module.exports = Commander;
