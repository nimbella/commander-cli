// Copyright (c) 2020-present, Nimbella, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const shell = require('shelljs');
const chalk = require('chalk');
const open = require('open');
const inquirer = require('inquirer');
const inquirerCommandPrompt = require('inquirer-command-prompt');
const { nimbellaDir } = require('@nimbella/nimbella-deployer');
const { NimBaseCommand } = require('@nimbella/nimbella-cli');

const login = require('../credentials');
const renderResult = require('../render');
const {
  replCommands,
  commanderCommands,
  notSupportedByCLI,
} = require('../utils/commands');
const { invokeCommand, register } = require('../utils');
const commands = require('../commands');
const yargs = require('yargs-parser');

inquirerCommandPrompt.setConfig({
  history: {
    save: true,
    folder: nimbellaDir(),
    limit: 20,
  },
});
inquirer.registerPrompt('command', inquirerCommandPrompt);

const init = async () => {
  const isFirstCommanderLogin = await login.isFirstLogin();
  if (isFirstCommanderLogin === null) {
    console.error(
      'You need to login with a client token to initialize your environment. Contact your Commander administrator for a token.'
    );
    process.exit(1);
  } else if (isFirstCommanderLogin === true) {
    await register(true);
  } else {
    const { username, client, accountName } = await login.getClientCreds();

    console.log(
      `Your client: ${chalk.bold(accountName)} (${client}) (${username.slice(
        0,
        10
      )}...)\nYour namespace: ${(await login.getUserCreds()).namespace}`
    );
  }
};

/**
 * Returns the version of Commander CLI.
 * @returns {string} Current version of the CLI.
 */
const getVersion = () => {
  const { version } = require('../../package.json');
  return `v${version}`;
};

const getHelp = () => {
  const helpOutput = [
    `${chalk.bold('Commander CLI')}`,
    `A CLI to interact with Commander from your terminal.`,
    '', // Empty line
    `${chalk.bold('USAGE')}`,
    `$ ${chalk.green('nim commander')} - launch Commander REPL`,
    `$ ${chalk.green('nim commander help')} - display help for Commander CLI`,
    `$ ${chalk.green('nim commander docs')} - open documentation`,
    `$ ${chalk.green(
      'nim commander <command> [command_params/command_options]'
    )} - run commander commands`,
    '', // Empty line
    `${chalk.bold('REPL Commands')}`,
    `${chalk.green('exit')} - exit the repl`,
    `${chalk.green('clear')} - clear the repl`,
    `${chalk.green('help')} - display help in repl`,
    `${chalk.green('history')} - show recently executed commands`,
    '', // Empty line
    `${chalk.bold('Commander Commands')}`,
    `${chalk.green(
      'command_create <command> [<parameters>] ...'
    )} - Creates a command & opens online source editor`,
    `${chalk.green(
      'csm_install <command-set>'
    )} - Install from Nimbella Command Set Registry: https://github.com/nimbella/command-sets`,
    `${chalk.green(
      'csm_install /path/to/your/command-set'
    )} - Install a local Command Set`,
    `${chalk.green(
      'csm_install github:<owner>/<repository>'
    )} - Install a Command Set hosted on GitHub`,
    '', // Empty line
    `Please refer https://nimbella.com/resources-commander/reference to learn about Commander commands.`,
  ];

  return helpOutput.join('\n');
};

const commanderHelp = [
  {
    name: 'What is Commander, what can I do with it? 🔗',
    value:
      'https://nimbella.com/resources-commander/overview#what-is-commander',
  },
  {
    name: 'Commander reference manual 🔗',
    value:
      'https://nimbella.com/resources-commander/reference#command-reference',
  },
  {
    name: 'Creating and deploying custom commands 📺',
    value: 'https://www.youtube.com/watch?v=HxaLII_IGzY',
  },
  {
    name: 'What are Command-sets and how do I build them? 🔗',
    value: 'https://github.com/nimbella/command-sets',
  },
  {
    name: 'Quick start on using Commander 🔗',
    value: 'https://nimbella.com/resources-commander/quickstart#quickstart',
  },
];

const csmInstallOrUpdate = async command => {
  const fs = require('fs');
  const path = require('path');
  const commandSetPath = command.split(' ')[1];
  if (!path.isAbsolute(commandSetPath) && !commandSetPath.startsWith('./')) {
    return {
      text: 'skip',
    };
  }
  const commandSetDir = path.isAbsolute(commandSetPath)
    ? commandSetPath
    : path.join(process.cwd(), commandSetPath);

  let response = {};
  if (fs.existsSync(commandSetDir)) {
    const execa = require('execa');
    const Listr = require('listr');
    const commandSetName = path.basename(commandSetDir);
    const zipPath = path.join(process.cwd(), commandSetName + '.zip');

    const tasks = new Listr([
      {
        title: `Packaging ${commandSetName}...`,
        task: async () => {
          const archiver = require('archiver');
          // create a file to stream archive data to.
          const output = fs.createWriteStream(zipPath);
          const archive = archiver('zip', {
            zlib: { level: 9 }, // Sets the compression level.
          });

          // pipe archive data to the file
          archive.pipe(output);

          archive.directory(commandSetDir, commandSetName);

          await archive.finalize();
        },
      },
      {
        title: `${
          command.startsWith('csm_update') ? 'Updating' : 'Installing'
        } ${commandSetName}...`,
        task: async () => {
          await execa.command(`nim object create ${zipPath}`);
          // Retrieve the URL of the uploaded object.
          const { stdout: nim_project_url } = await execa.command(
            `nim object url ${path.basename(zipPath)}`
          );

          // Remove the zip
          fs.unlinkSync(zipPath);

          // Only pass the basename so the command set name doesn't contain paths.
          command = command.split(' ')[0] + ' ' + commandSetName;
          const { data } = await invokeCommand(command, { nim_project_url });
          response = data;
          // Delete the object after installation is done.
          await execa.command(`nim object delete ${path.basename(zipPath)}`);
        },
      },
    ]);

    await tasks.run().catch(e => {
      return {
        attachments: [
          {
            color: 'danger',
            text: e,
          },
        ],
      };
    });
  } else {
    response = {
      attachments: [
        {
          color: 'danger',
          text: `Path ${commandSetDir} doesn't exist.`,
        },
      ],
    };
  }

  return response;
};

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
  const raw = yargs(command);
  const args = raw._.map(arg =>
    // Strip ",' if args start with them.
    typeof arg === String && (arg.startsWith("'") || arg.startsWith('"'))
      ? arg.slice(1, arg.length - 1)
      : arg
  )
    // Remove command from args
    .slice(1);

  try {
    if (notSupportedByCLI.includes(command.split(' ')[0])) {
      const { client } = await login.getClientCreds();
      if (client === 'cli') {
        return {
          text: 'This command is not supported when the client is `cli`.',
        };
      }
    }

    if (command.startsWith('/nc')) {
      command = command.substring(command.indexOf(' ') + 1).trim();
    } else if (command.startsWith('nim') && shell.which('nim')) {
      shell.exec(command);
      return null;
    }

    if (command.startsWith('doc')) {
      await open('https://github.com/nimbella/commander-cli#commander-cli');
      return {
        text: `Opening https://github.com/nimbella/commander-cli#commander-cli...`,
      };
    }

    let requestBody = {};

    if (command.startsWith('csm_install') || command.startsWith('csm_update')) {
      const res = await csmInstallOrUpdate(command);
      if (res.text !== 'skip') {
        return res;
      }
    }

    if (command === '?' || command === 'help') {
      getHelp(command);
      return null;
    }

    if (command.startsWith('client')) {
      if (raw.apihost && !raw.apihost.length) {
        return {
          text: 'API Host is not specified',
        };
      }
      if (raw.apihost && !raw.apihost.startsWith('http')) {
        return {
          text: 'API Host needs to begin with http[s]',
        };
      }
      args.push(raw.apihost);
      return await commands.client(args);
    }

    if (command.startsWith('history')) {
      return await commands.history();
    }

    if (command === 'workbench') {
      const workbenchUrl = encodeURI(await login.getWorkbenchURL());
      open(workbenchUrl);
      return { text: `Opening ${workbenchUrl}...` };
    }

    if (command.startsWith('command_set')) {
      return commands.commandSet(args);
    }

    if (command.startsWith('app_add') || command.startsWith('app_delete')) {
      return {
        text: 'Sorry, app addition/deletion is not supported in the cli mode',
      };
    }

    loader = twirlTimer();
    const res = await invokeCommand(command, requestBody);
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
      prefix: '',
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
    } else if (['version', '-v', '--version'].includes(args[0])) {
      console.log(getVersion());
      process.exit();
    } else {
      const isFirstCommanderLogin = await login.isFirstLogin();
      if (isFirstCommanderLogin === null) {
        console.error(
          'You need to login with a client token to initialize your environment. Contact your Commander administrator for a token.'
        );
        process.exit(1);
      } else {
        if (isFirstCommanderLogin === true) {
          await register(false);
        }
        const result = await runCommand(args.join(' '));
        console.log(renderResult(result));
      }
    }
  } else {
    await init();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const command = await getCommand();
      switch (command) {
        case 'exit':
          process.exit();
          break;
        case '':
          continue;
        case 'clear':
          console.clear();
          break;
        case '?':
        case 'help': {
          console.log(getHelp() + '\n');
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
        case 'version':
          console.log(getVersion());
          break;
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
