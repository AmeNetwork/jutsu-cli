#! /usr/bin/env node
import fs from "fs";
import lib from "./lib.js";
import path from "path";
import { fileURLToPath } from "url";
import clc from "cli-color";
import { select, input } from "@inquirer/prompts";
import { Command } from "commander";
import dotenv from "dotenv/config";
const program = new Command();
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

program
  .name("jutsu")
  .description("CLI to some JavaScript string utilities")
  .version("0.2.0", "-v, --version", "output the current version");

program
  .command("new")
  .description("create a new project")
  .argument("<string>")
  .action((_projectName) => {
    if (fs.existsSync(_projectName)) {
      console.log(clc.red("File already exists"));
    } else {

      // const templatePath = path.join(__dirname, "template");
      // const destFolder = path.join(process.cwd(), _projectName);
      lib.initNewProject(_projectName)


      // lib.copyFolder(templatePath, destFolder);
      // lib.initConfig(_projectName);
      // lib.initLocal(_projectName);
      // lib.printFileStruct(_projectName);
    }
  });

// program
//   .command("add")
//   .description("add a new component.sol to /src")
//   .argument("<string>")
//   .action((_componentName) => {
//     if (fs.existsSync("src")) {
//       if (fs.existsSync(_componentName)) {
//         console.log(clc.red("File already exists"));
//       } else {
//         lib.createComponent(_componentName);
//         console.log(
//           clc.green("✔️ " + _componentName + ".sol"),
//           clc.white("has been added to /src")
//         );
//       }
//     } else {
//       console.log(
//         clc.yellow("Please create a project first"),
//         clc.bgWhite("jutsu new <name>")
//       );
//     }
//   });

program
  .command("deploy")
  .description("deploy smart contract")
  .option("-n, --network <string>", "deploy network")
  .option("-a, --arguments [arguments...]", "contract arguments")
  .argument("<string>", "file path")
  .action((filePath, options) => {
    lib.deploy(filePath, options.network, options.arguments);
  });

// program
//   .command("view")
//   .description("view component detail")
//   .option("-n, --network <string>", "deploy network")
//   .option("-c, --contract <string>", "contract address")
//   .action((options) => {
//     lib.deploy(filePath, options.network, options.arguments);
//   });

// program
//   .command("get")
//   .description("send get request")
//   .option("-n, --network <string>", "contract network")
//   .option("-c, --contract <string>", "contract address")
//   .option("-f, --function <string>", "contract function name")
//   .option("-a, --arguments [arguments...]", "contract arguments")
//   .action((options) => {
//     console.log(options);
//   });

program
  .command("add")
  .description("add a component")
  .argument("<string>", "component name")
  .action((componentName) => {
    lib.installComponent(componentName);
  });

program
  .command("publish")
  .description("publish your project")
  .action(() => {
    lib.publishComponent();
  });

// show help default
if (process.argv.length < 3) {
  program.help();
}

program.parse();
