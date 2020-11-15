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
import PostmanFetcher from '../fetcher'
import {writeFile} from '../writer'
import {getCollectionDoc} from '../generators/stub/common-gen'
import {
  getPostmanCurrentKey,
  authPersister,
  getPostmanKeys,
} from 'nimbella-deployer'

require('dotenv').config()
prompt.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))
const languages = ['go', 'js', 'ts', 'py', 'java', 'swift', 'php']

const defaultPromptParams: PromptParams = {
  type: 'input',
  message: '',
  choices: [],
  source: undefined,
  default: undefined,
}
interface PromptParams {
  type: any;
  message: string;
  choices: string[] | undefined;
  source: any;
  default: any;
}

export default class Postman extends Command {
  static description = 'Generates nimbella project from a postman collection';

  static examples = [
    `$ nim project create -t postman -i CloudKV.ioAPI -k PMAK-5e2a993188ce8e003888f36b-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Generating nimbella project!
`,
  ];

  static hidden = true;

  static strict = false;

  static flags = {
    key: flags.string({
      char: 'k',
      description: 'Key to access the Postman API',
      env: 'POSTMAN_KEY',
    }),
    id: flags.string({char: 'i', description: 'Collection Id/Name/Path'}),
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
      description: 'Sync updated document back to Postman',
    }),
    clientCode: flags.boolean({
      char: 'c',
      description: 'Generates client code',
      default: true,
    }),
    update: flags.boolean({description: 'Updates a project', default: false}),
    deploy: flags.boolean({
      char: 'd',
      description: 'Auto deploy',
      default: false,
    }),
    init: flags.boolean({description: 'Initiate a project', default: false}),
  };

  async run() {
    const {flags} = this.parse(Postman)
    const {update, init} = flags
    let furtherInquire = false
    let {
      id,
      key,
      language,
      overwrite,
      updateSource,
      clientCode,
      deploy,
    } = flags

    if (init) {
      const name = await this.getValue({
        message: 'Name of the project',
      })
      const description = await this.getValue({
        message: 'Project description',
      })
      const totalApis = await this.getValue({
        type: 'number',
        message: 'Number of APIs',
        default: 1,
      })
      const apis = []
      await (async () => {
        /* eslint-disable no-await-in-loop */
        for (let index = 1; index < totalApis + 1; index++) {
          const name = await this.getValue({
            message: `${index}. API name`,
          })
          const description = await this.getValue({
            message: `${index}. Description of ${name}`,
          })
          const method = await this.getValue({
            type: 'list',
            message: `${index}. Verb for ${name}`,
            choices: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
            default: 'GET',
          })
          apis.push({name, description, method})
        }
      })()
      /* eslint-enable no-await-in-loop */
      const meta = {name, description, apis}
      writeFile(
        {
          location: process.cwd(),
          name: `${name}.collection`,
          ext: 'json',
          verbose: false,
        },
        getCollectionDoc(meta),
      )
      id = `${name}.collection.json`
    }

    if (!key) {
      const keys = await getPostmanKeys(authPersister)
      const name = await getPostmanCurrentKey(authPersister)
      key = keys[name]
      if (!key) {
        key = await this.getValue({
          message: 'Postman API Key',
        })
      }
    }

    let collections: any[]
    async function searchCollections(answers: any, input: string) {
      if (!collections) {
        const fetcher = new PostmanFetcher(key)
        collections = await fetcher.getAllCollections()
      }
      input = input || ''
      return filter(
        input,
        collections.map(e => e.name),
      ).map(e => e.original)
    }

    if (!init && !id) {
      id = await this.getValue({
        type: 'autocomplete',
        message: 'Collection Name',
        source: (results: any, input: any) => {
          return searchCollections(results, input)
        },
      })
      furtherInquire = true
    }

    if (furtherInquire) {
      language = await this.getValue({
        type: 'list',
        message: 'Target Language',
        choices: languages,
        default: 'js',
      })
      overwrite = await this.getValue({
        type: 'confirm',
        message:
          'Overwrite the existing Nimbella Project directory if it exists',
        default: true,
      })
      updateSource = await this.getValue({
        type: 'confirm',
        message: 'Sync Updated Collection back to Postman Cloud',
        default: false,
      })
      clientCode = await this.getValue({
        type: 'confirm',
        message: 'Generate Client Code',
        default: true,
      })
      deploy = await this.getValue({
        type: 'confirm',
        message: 'Auto deploy',
        default: false,
      })
    }

    new Generator({
      id,
      key,
      language,
      overwrite,
      deploy,
      deployForce: false,
      updateSource,
      clientCode,
      update,
      init,
    })
    .generate()
    .catch((error: string) => {
      logger.error('Oops! Some Error Occurred, Please Try Again', error)
    })
  }

  async getValue(promptParams: any) {
    const options = {...defaultPromptParams, ...promptParams}
    const value = await prompt<{
      val: any;
    }>({
      name: 'val',
      ...options,
    })
    return value.val
  }
}
