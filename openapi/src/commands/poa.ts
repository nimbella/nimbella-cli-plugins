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

import {Command, flags} from '@oclif/command'
import {prompt} from 'inquirer'
import {filter} from 'fuzzy'
import Generator from '../invoker'
import logger from '../logger'
import SwaggerHubFetcher from '../fetcher'

require('dotenv').config()
prompt.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))
const languages = ['go', 'js', 'ts', 'py', 'java', 'swift', 'php']
export default class OpenAPI extends Command {
  static description =
    'Generates nimbella project from an openapi specification';

  static examples = [
    `$ nim openapi -i petstore --owner bhageena
Generating nimbella project!
`,
  ];

  static hidden = true;
  static strict = false;
  static flags = {
    key: flags.string({
      char: 'k',
      description: 'Key to access the registry API for SwaggerHub',
      env: 'SWAGGERHUB_KEY',
    }),
    owner: flags.string({description: 'Owner User of API', env: 'OWNER'}),
    id: flags.string({char: 'i', description: 'Spec Name/Path'}),
    version: flags.string({
      char: 'v',
      description: 'Spec Version',
      default: '1.0.0',
    }),
    language: flags.string({
      char: 'l',
      description: 'Target Language',
      default: 'js',
      options: languages,
    }),
    overwrite: flags.boolean({
      char: 'o',
      description:
        'Overwrites the existing nimbella project directory if it exists',
    }),
    updateSource: flags.boolean({
      char: 'u',
      description: 'Sync updated document back to SwaggerHub',
    }),
    clientCode: flags.boolean({
      char: 'c',
      description: 'Generates client code',
      default: true,
    }),
    update: flags.boolean({description: 'Updates a project', default: false}),
  };

  async run() {
    const {flags} = this.parse(OpenAPI)
    const {update} = flags
    let furtherInquire = false
    let {
      id,
      key,
      version,
      owner,
      language,
      overwrite,
      updateSource,
      clientCode,
    } = flags

    if (!key) {
      key = await this.getValue({
        type: 'input',
        message: 'SwaggerHub API Key',
        choices: [],
        source: undefined,
        default: undefined,
      })
    }
    if (!owner) {
      owner = await this.getValue({
        type: 'input',
        message: 'API owner user',
        choices: [],
        source: undefined,
        default: undefined,
      })
    }
    let specs: any[]
    async function searchSpecs(answers: any, input: string) {
      if (!specs) {
        const fetcher = new SwaggerHubFetcher(key)
        specs = await fetcher.getSpecVersions(owner)
      }
      input = input || ''
      return filter(
        input,
        specs.map(e => e),
      ).map(e => `${e.original}`)
    }
    if (!id) {
      id = await this.getValue({
        type: 'autocomplete',
        message: 'Spec Title (Name - Version)',
        choices: [],
        source: (results: any, input: any) => {
          return searchSpecs(results, input)
        },
        default: undefined,
      })
      furtherInquire = true
    }

    if (furtherInquire) {
      const parts = (id || '').match(/\(([^)]+)\)/)![1].split('-')
      id = parts[0]
      version = parts[1]
      language = await this.getValue({
        type: 'list',
        message: 'Target Language',
        choices: languages,
        source: undefined,
        default: 'js',
      })
      overwrite = await this.getValue({
        type: 'confirm',
        message:
          'Overwrite the existing Nimbella Project directory if it exists',
        choices: [],
        source: undefined,
        default: true,
      })
      updateSource = await this.getValue({
        type: 'confirm',
        message: 'Sync Updated Spec back to SwaggerHub',
        choices: [],
        source: undefined,
        default: false,
      })
      clientCode = await this.getValue({
        type: 'confirm',
        message: 'Generate Client Code',
        choices: [],
        source: undefined,
        default: true,
      })
    }

    new Generator({
      id,
      version,
      key,
      owner,
      language,
      overwrite,
      update,
      deploy: false,
      deployForce: false,
      updateSource,
      clientCode,
    })
    .generate()
    .catch((error: string) => {
      console.log('Oops! Some Error Occurred, Please Try Again')
      logger.error(error)
    })
  }

  private async getValue(promptParams: PromptParams) {
    const value = await prompt<{
      val: any;
    }>({
      name: 'val',
      ...promptParams,
    })
    return value.val
  }
}

interface PromptParams {
  type: any;
  message: string;
  choices: string[] | undefined;
  source: any;
  default: any;
}
