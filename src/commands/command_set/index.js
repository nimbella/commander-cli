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
    const { commandName } = await prompt([
      {
        type: 'input',
        default: `command${i}`,
        message: `Name of your command ${i}?`,
        name: 'commandName',
      },
    ]);

    commandSet.commands.push({ commandName });
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
  const commandsDir = join(commandSetDir, `/projects/${commandSet.name}`);

  // Create directories.
  await mkdirp(commandsDir);

  const commands = {};
  const languageExtension = getExtension(commandSet.language);
  const commandCode = await readFile(
    join(__dirname, `templates/CommandSource.${languageExtension}.txt`)
  );

  for (const command of commandSet.commands) {
    commands[command.commandName] = { description: '' };

    // Create command code with template code.
    await writeFile(
      join(commandsDir, `${command.commandName}.${languageExtension}`),
      commandCode
    );
  }

  // Create commands.yaml file.
  const commandsYaml = yaml.safeDump({
    commands,
  });
  await writeFile(join(commandSetDir, 'commands.yaml'), commandsYaml);
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
