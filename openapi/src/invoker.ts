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

import {existsSync} from 'fs'
import {join} from 'path'
import {blue, red, green} from 'chalk'
import Listr = require('listr');
import {read, isValid, SpecInfo} from './reader'
import {
  getInstance,
  getMethodStub,
  getTestStub,
  getClientStub,
} from './generators/stub/stub-gen'
import {sanitizeFileName} from './utils'
import SwaggerHubSyncer from './syncer'
import GeneratorInfo from './generators/stub/gen-info'
import logger from './logger'
import {upgrade, saveSpec, writeOrUpdateFile} from './writer'
import ProjectGenerator from './generators/proj-gen'
import SwaggerHubFetcher from './fetcher'

let langExt: string
let langVariant: string
let lang: string
let genInstance: GeneratorInfo
let sh: SpecInfo
let workDir: string
let specName: string

export default class Generate {
  id: string | undefined;

  version: string;

  key: string | undefined;

  owner: string | undefined;

  language: string;

  overwrite: boolean;

  update: boolean;

  deploy: boolean;

  deployForce: boolean;

  updateSource: boolean;

  clientCode: boolean;

  projectGenerator: ProjectGenerator;

  constructor(options: InvokerOptions) {
    this.id = options.id
    this.version = options.version
    this.key = options.key
    this.owner = options.owner
    this.language = options.language
    this.overwrite = options.overwrite
    this.update = options.update
    this.deploy = options.deploy
    this.deployForce = options.deployForce
    this.updateSource = options.updateSource
    this.clientCode = options.clientCode
    this.projectGenerator = new ProjectGenerator()
  }

  validate = async () => {
    lang = this.language
    if (lang.includes(':')) {
      const langDetail = lang.split(':');
      [lang, langVariant] = langDetail
    }
    genInstance = getInstance(lang)
    if (!langVariant) langVariant = genInstance.variant

    langExt = genInstance.ext

    // if key is given, get spec from SwaggerHub
    if (this.key) {
      const fetcher = new SwaggerHubFetcher(this.key)
      sh = await fetcher.getOAS(this.owner || '', specName, this.version)
    } else {
      sh = await read(specName)
    }
    if (!sh.spec) {
      const msg = `Couldn't read spec ${blue(specName)}`
      logger.warn(msg)
      throw new Error(msg)
    }

    if (sh.spec && !isValid(sh.spec)) {
      const msg = `${blue(specName)} is not a valid OpenAPI spec.`
      logger.warn(msg)
      throw new Error(msg)
    }
    if (!sh.version.startsWith('3')) {
      console.log(
        `${blue(
          specName,
        )} is not in version 3.x format of OpenAPI spec. ${green(
          'Attempting with a converted version.',
        )}`,
      )
      sh.spec = upgrade(specName)
    }

    specName = sanitizeFileName(sh.spec.info.title)

    if (existsSync(specName) && !(this.overwrite || this.update)) {
      const msg = `Oops! a directory named ${blue(specName)} already exists.`
      console.log(msg)
      console.log(
        `Please move the directory or use ${blue('--overwrite')} to continue...`,
      )
      console.log(`${red("'--overwrite or -o' will delete the directory.")}`)
      throw new Error(msg)
    }
  };

  generateActions = async () => {
    async function itemGroupOps(itemsOpsArray: any) {
      for await (const item of itemsOpsArray) {
        item
      }
    }
    const itemOps = async (item: any) => {
      for await (const actionItem of Object.keys(item)) {
        const action = item[actionItem]
        const actionPath = sanitizeFileName(action.tags[0])
        const itemName = sanitizeFileName(action.operationId)

        // write action stubs
        const methodStub = await getMethodStub(action)
        writeOrUpdateFile(
          {
            location: join(workDir, 'packages', actionPath, itemName),
            name: 'index',
            ext: langExt,
            verbose: true,
          },
          methodStub,
          this.update,
        )

        // generate unit tests
        const testStub = await getTestStub(action, workDir, actionItem)
        writeOrUpdateFile(
          {
            location: join(workDir, 'test', actionPath),
            name: `${itemName}.test`,
            ext: langExt,
            verbose: true,
          },
          testStub,
          this.update,
        )

        // generate client code
        if (this.clientCode) {
          try {
            const clientStub = await getClientStub(lang, langVariant, action)
            writeOrUpdateFile(
              {
                location: join(workDir, 'client', actionPath),
                name: itemName,
                ext: langExt,
                verbose: true,
              },
              clientStub,
              this.update,
            )
          } catch (error) {
            logger.error(error)
          }
        }
      }
    }

    const itemsOpsArray = Object.values(sh.spec.paths).map(itemOps)
    return itemGroupOps(itemsOpsArray)
  };

  generatePackages = async (): Promise<void> => {
    workDir = this.projectGenerator.generateSkeleton({
      base: process.cwd(),
      dir: specName,
      spec: sh.spec,
      update: this.update,
      generator: genInstance.generator,
    })
    const items = Object.values(sh.spec.paths)
    sh.spec.tags.forEach(async (itemGroup: any) => {
      // iteratively update project.yml
      const groupName = sanitizeFileName(itemGroup.name)
      itemGroup.urls
      this.projectGenerator.updateProjectYML(
        workDir,
        `\n  - name: ${groupName}\n    actions:\n`,
      )
      items.forEach(async (item: any) => {
        const actions = Object.values(item)
        actions.forEach(async (element: any) => {
          if (element.tags[0] === groupName) {
            this.projectGenerator.updateProjectYML(
              workDir,
              `      - name: ${element.operationId}\n`,
            )
          }
        })
      })
    })

    // update new url
    const getURL = async (isWebAction = false) => {
      const namespace = this.projectGenerator.getCurrentNamespace()
      if (isWebAction) {
        return `https://apigcp.nimbella.io/api/v1/web/${namespace}/`
      }
      return `https://${namespace}-apigcp.nimbella.io/api/`
    }

    sh.spec.servers.forEach(async (itemGroup: any) => {
      itemGroup.url = await getURL()
    })
  };

  generate = async (): Promise<void> => {
    try {
      specName = this.id || ''
      const tasks = new Listr([
        {
          title: 'Getting Spec',
          task: () => this.validate(),
        },
        {
          title: 'Generating Packages',
          task: () => this.generatePackages(),
        },
        {
          title: 'Generating Actions',
          task: () => this.generateActions(),
        },
        {
          title: 'Writing Updated Spec',
          task: () =>
            saveSpec(join(workDir, `${specName}._openapi.json`), sh.spec),
        },
        {
          title: 'Syncing Updated Collection to SwaggerHub',
          skip: () => {
            if (this.key && this.updateSource) {
              return false
            }
            return true
          },
          task: () =>
            new SwaggerHubSyncer(this.key || '').updateSpec(specName, sh),
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
export interface InvokerOptions {
  id: string | undefined;
  version: string;
  key: string | undefined;
  owner: string | undefined;
  language: string;
  overwrite: boolean;
  deploy: boolean;
  deployForce: boolean;
  updateSource: boolean;
  clientCode: boolean;
  update: boolean;
}
