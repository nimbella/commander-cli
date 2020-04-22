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
const { prompt } = require('inquirer');
const login = require('./login');
const renderResult = require('./render');

const init = () => {
  if (!shell.which('nim')) {
    console.log(
      'Commander CLI requires nim. You can install it by following the instructions at https://nimbella.io/downloads/nim/nim.html#install-the-nimbella-command-line-tool-nim'
    );
    process.exit(1);
  }

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
  login.register(true);
};

const getHelp = () => {
  const helpOutput = [
    `${chalk.bold('Commander CLI')}`,
    `A CLI to interact with Commander from your terminal.`,
    '', // Empty line
    `${chalk.bold('USAGE')}`,
    `$ ${chalk.green('ncc')} - launch Commander REPL`,
    `$ ${chalk.green('ncc help')} - display help for Commander CLI.`,
    `$ ${chalk.green(
      'ncc <command> [command_params/command_options]'
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

const runCommand = async command => {
  let misc_data = {};
  let ns = null;

  try {
    if (login.isFirstTimeLogin() && command !== 'register') {
      console.log('Type register to start working on Commander');
      return null;
    }
    if (command === '?' || command === 'help') {
      getHelp(command);
      return null;
    }

    if (command.startsWith('login')) {
      login.login(command.substring(command.indexOf(' ') + 1));
      return null;
    }

    if (command === 'workbench') {
      open(login.getWorkbenchURL());
      return null;
    }

    if (command.startsWith('/nc')) {
      command = command.substring(command.indexOf(' ') + 1);
    } else if (command.startsWith('nim')) {
      shell.exec(command);
      return null;
    }

    if (command.startsWith('app_add') || command.startsWith('app_delete')) {
      console.log(
        'Sorry app addition/deletion is not supported in the cli mode'
      );
      return null;
    }

    if (command === 'register' && (ns = login.getNs())) {
      misc_data = Object.assign(misc_data, { '"namespace"': `"${ns}"` });
    }
    misc_data = JSON.stringify(misc_data);

    const res = shell.exec(
      `nim action invoke ` +
        `--auth=3d4d42c1-700e-4806-a267-dc633c68d174:f1LSnYE61RuqMuHg4Ac8TlrNBrKjE5C0CO0Q5NQzscmSLOWMCf5jsXUKitgdnCi7` +
        ` /nc-dev/portal/gateway ` +
        ` --result -p __ow_headers "{\\"accept\\": \\"application/json\\", ` +
        `\\"content-type\\": \\"application/x-www-form-urlencoded\\",` +
        ` \\"user-agent\\": \\"commander-cli\\" }"` +
        ` -p command /nc -p team_domain commander-cli` +
        ` -p syncRequest \\"true\\" -p text \"${command}\"` +
        ` -p user_id ${login.getUser()} -p team_id ${login.getTeam()} -p misc "${misc_data}"`,
      { silent: true }
    );

    if (res.code) {
      return JSON.stringify({
        body: {
          attachments: [
            {
              color: 'danger',
              text: res.stderr,
            },
          ],
        },
      });
    }

    return res.stdout;
  } catch (error) {
    return JSON.stringify({
      body: {
        attachments: [
          {
            color: 'danger',
            text: error.message,
          },
        ],
      },
    });
  }
};

async function getCommand() {
  const { command } = await prompt([
    {
      type: 'input',
      name: 'command',
      message: 'nc>',
    },
  ]);

  return command;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    if (['help', '--help', '-h'].includes(args[0])) {
      console.log(getHelp());
      process.exit();
    } else {
      login.register(false);
      const result = await runCommand(args.join(' '));
      console.log(renderResult(result));
    }
  } else {
    init();

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
          const { link } = await prompt({
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

          const browserDependentCommands = [
            'command_create',
            'command_code',
            'secret_create',
          ];

          if (browserDependentCommands.includes(command.split(/\s/)[0])) {
            const link = JSON.parse(result).body.text.match(/<(.+)\|(.+)>/)[1];
            console.log('Opening your default browser...');
            await open(link);
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

main().catch(error => console.log(`nc> ${error.message}`));
