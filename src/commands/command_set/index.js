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

function generateReadme(commandSetName, commandsYamlPath) {
  const fs = require('fs');
  const yaml = require('js-yaml');

  const file = commandsYamlPath;
  const { commands } = yaml.safeLoad(fs.readFileSync(file, 'utf8'));

  const title = `# ${commandSetName} Command Set\n\n`;
  const commandsSection = ['## Commands\n'];
  const usageSection = ['## Usage\n'];

  for (const [command, commandDetails] of Object.entries(commands).sort()) {
    let cmdRep = `/nc ${command}`;

    if (commandDetails.parameters) {
      for (const parameter of commandDetails.parameters) {
        if (parameter.optional) {
          cmdRep += ` [<${parameter.name}>]`;
        } else {
          cmdRep += ` <${parameter.name}>`;
        }
      }
    }

    if (commandDetails.options) {
      for (const option of commandDetails.options) {
        cmdRep += ` [-${option.name} <${
          option.value ? option.value : option.name
        }>]`;
      }
    }

    commandsSection.push(`- [\`${command}\`](#${command})`);

    usageSection.push(`### \`${command}\`\n`);

    if (commandDetails.description) {
      usageSection.push(commandDetails.description);
    }

    usageSection.push(`\`\`\`sh\n${cmdRep}\n\`\`\`\n`);
  }

  return title + commandsSection.join('\n') + '\n\n' + usageSection.join('\n');
}

function parseCommandProperties(cmd) {
  const command = { name: '', options: [], parameters: [] };
  command.name = cmd.trim().split(' ').shift();
  // This is to help regex when the last substring is a parameter.
  cmd += ' ';

  // Matches [-flag] or [-flag <value>]
  const options =
    cmd.match(/\[-([\w\d]+)\]|\[-([\w\d]+)(?:\s+\<([^\]]+))?\>]/g) || [];

  // Matches [<optional>]
  const optionalParameters = cmd.match(/\[\<([\w\d]+)\>\]/g) || [];

  // Matches <parameter>
  const parameters = cmd.match(/\<([\w\d]+)\>[^\]]/g) || [];

  for (const option of options) {
    const flagValues = option.trim().split(' ');
    const name =
      flagValues.length === 2
        ? flagValues[0].slice(2) // Remove [-
        : flagValues[0].slice(2, -1); // Remove [-]

    const value =
      flagValues.length === 2
        ? flagValues[1].slice(1, -2) // Remove <>]
        : name;

    command.options.push({
      name,
      value,
    });
  }

  for (const parameter of parameters) {
    command.parameters.push({
      name: parameter.trim().slice(1, -1), // Remove <>
      optional: false,
    });
  }

  for (const optionalParameter of optionalParameters) {
    command.parameters.push({
      name: optionalParameter.trim().slice(2, -2), // Remove [<>]
      optional: true,
    });
  }

  return command;
}

const askQuestions = async () => {
  const { prompt } = require('inquirer');
  const commandSet = {
    name: '',
    commands: [],
  };

  const { name } = await prompt([
    {
      type: 'input',
      name: 'name',
      message: 'What is the name of your command set?',
    },
  ]);

  commandSet.name = name;

  const { numberOfCommands } = await prompt([
    {
      type: 'number',
      name: 'numberOfCommands',
      default: 1,
      message: 'How many commands do you want in your command set?',
    },
  ]);

  const { language } = await prompt([
    {
      type: 'list',
      name: 'language',
      default: 'NodeJS',
      message: `Select language for ${name}`,
      choices: ['NodeJS', 'Python', 'Go'],
    },
  ]);

  commandSet.language = language;

  for (let i = 1; i <= numberOfCommands; i++) {
    const { commandDefinition } = await prompt([
      {
        type: 'input',
        default: `hello${i} <name>`,
        message: `Define your command ${i}:`,
        name: 'commandDefinition',
        validate: input => {
          return new Promise((resolve, reject) => {
            // Test if the second word contains < or [ which indicates that it is an option
            if (!/\<|\[/.test(input.split(' ')[1])) {
              reject('spaces are not allowed in command names.');
            }

            resolve(true);
          });
        },
      },
    ]);

    const commandName = commandDefinition.trim().split(' ')[0];
    const { commandDescription = '' } = await prompt([
      {
        type: 'input',
        message: `Provide a small description for ${commandName}:`,
        name: 'commandDescription',
      },
    ]);

    commandSet.commands.push({
      description: commandDescription,
      ...parseCommandProperties(commandDefinition),
    });
  }

  return commandSet;
};

const getExtension = language => {
  if (language === 'Python') {
    return 'py';
  } else if (language === 'Go') {
    return 'go';
  } else {
    return 'js';
  }
};

const createCommandSet = async commandSet => {
  const { writeFile, readFile } = require('fs').promises;
  const { join } = require('path');
  const mkdirp = require('mkdirp');
  const yaml = require('js-yaml');

  const commandSetDir = join(process.cwd(), commandSet.name);
  const commandsDir = join(commandSetDir, `/packages/${commandSet.name}`);

  // Create directories.
  await mkdirp(commandsDir);

  const commands = {};
  const languageExtension = getExtension(commandSet.language);
  const commandCode = await readFile(
    join(__dirname, `templates/CommandSource.${languageExtension}.txt`)
  );

  for (const command of commandSet.commands) {
    commands[command.name] = command;
    // Remove irrelavent fields
    if (commands[command.name].options.length === 0) {
      delete commands[command.name].options;
    }

    if (commands[command.name].parameters.length === 0) {
      delete commands[command.name].parameters;
    }

    // Create commands with template code.
    await writeFile(
      join(commandsDir, `${command.name}.${languageExtension}`),
      commandCode
    );

    // The primary reason to remove .name is because we use the same object to generate Yaml file and
    // we don't want a name field under command.
    delete commands[command.name].name;
  }

  const commandsYamlPath = join(commandSetDir, 'commands.yaml');

  // Create commands.yaml file.
  const commandsYaml = yaml.safeDump({
    commands,
  });
  await writeFile(commandsYamlPath, commandsYaml);

  // Create readme.md file.
  const readmePath = join(commandSetDir, 'README.md');
  await writeFile(
    readmePath,
    generateReadme(commandSet.name, commandsYamlPath)
  );
};

module.exports = async (args = []) => {
  if (args.length === 0) {
    return {
      text: `Run \`command_set create\` to create a new command set.`,
    };
  }
  if (args[0] === 'create') {
    const path = require('path');
    const commandSet = await askQuestions();
    await createCommandSet(commandSet);

    return {
      text: `Command set created at ${path.join(
        process.cwd(),
        commandSet.name
      )}`,
    };
  } else {
    return {
      text: `Unknown argument: \`${args[0]}\``,
    };
  }
};
