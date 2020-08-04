/*
 * Copyright (c) 2019 - present Nimbella Corp.
 *
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {sep, basename, join} from 'path'
import {existsSync} from 'fs'
import {blue, red} from 'chalk'
import Listr = require('listr');
import logger from './logger'
import {Utils} from './utils'
import {writeNimSpec} from './generators/nimbella'
import {writeOpenApiSpec} from './generators/openapi'
import {writePostmanSpec} from './generators/postman'
import {read} from './reader'

export default class Invoker {
  spec: string;

  overwrite: boolean;

  util: Utils;

  constructor(spec: string, overwrite: boolean) {
    this.spec = spec
    this.overwrite = overwrite
    this.util = new Utils()
  }

  generateSpec = async (): Promise<void> => {
    const namespace = this.util.getCurrentNamespace()
    const cwd = process.cwd()
    const meta = {
      cwd,
      spec: this.spec,
      name: cwd.split(sep).pop(),
      namespace,
      packages: [{}],
    }
    this.packagesDirExists(meta)
    this.specExists(meta)
    meta.packages = read(cwd)
    switch (this.spec) {
    case 'nimbella':
      await writeNimSpec(meta)
      break
    case 'openapi':
      await writeOpenApiSpec(meta)
      break
    case 'postman':
      await writePostmanSpec(meta)
      break
    default:
      break
    }
  };

  packagesDirExists = (meta: any): void => {
    const packagesDirPath = join(meta.cwd, 'packages')
    if (!existsSync(packagesDirPath)) {
      console.log(
        `Oops! Couldn't find a ${blue('packages')} directory at ${blue(
          meta.cwd,
        )}.`,
      )
      const validationError =
        "Doesn't seem to be a valid nimbella project or there are no APIs in it. Exiting!"
      console.log(`${red(validationError)}`)
      throw new Error(validationError)
    }
  };

  specExists = (meta: any): void => {
    if (!this.overwrite) {
      let specPath = join(meta.cwd, `${meta.name}.${meta.spec}.json`)
      if (meta.spec === 'nimbella')
        specPath = join(meta.cwd, 'project.nimbella.yml')
      if (existsSync(specPath)) {
        console.log(
          `Oops! A file named ${blue(basename(specPath))} already exists.`,
        )
        console.log(
          `Please move the file or use ${blue('--overwrite')} to continue...`,
        )
        console.log(
          `${red("'--overwrite or -o' will delete the exiting file.")}`,
        )
        throw new Error('already exists')
      }
    }
  };

  generate = async (): Promise<void> => {
    try {
      const tasks = new Listr([
        {
          title: `Generating ${this.util.toTitleCase(
            this.spec,
          )} API Specifications!`,
          task: async () => this.generateSpec(),
        },
      ])

      tasks.run().catch((error: any) => {
        logger.error(error)
      })
    } catch (error) {
      console.error(error)
      console.log(
        "Couldn't complete the process, some error occurred. Please try again!",
      )
    }
  };
}
