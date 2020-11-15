/* eslint-disable no-unused-expressions */
/* eslint-disable no-restricted-syntax */
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

import {existsSync, statSync} from 'fs'
import {join} from 'path'
import {blue, red, green} from 'chalk'
import {ItemGroup} from 'postman-collection'
import {read, isValid, CollectionInfo} from './reader'
import {
  getInstance,
  getMethodStub,
  getTestStub,
  getClientStub,
  getMethodValidationStub,
  getGlobalValidationStub,
} from './generators/stub/stub-gen'
import {
  getSuccessSuite,
  getFailureSuite,
  getEnvVars,
  getMethodValidations,
  getGlobalValidations,
} from './generators/test/test-gen'
import {sanitizeFileName, isGuid, isPublicApi} from './utils'
import PostmanFetcher from './fetcher'
import PostmanSyncer from './syncer'
import GeneratorInfo from './generators/stub/gen-info'
import logger from './logger'
import {
  upgrade,
  saveCollection,
  writeOrUpdateFile,
  appendEnvFile,
} from './writer'
import ProjectGenerator from './generators/proj-gen'
import Listr = require('listr');

let langExt: string
let langVariant: string
let lang: string
let collectionName: string
let genInstance: GeneratorInfo
let pm: CollectionInfo
let workDir: string
let collectionId: string

export default class Generate {
  id: string | undefined;

  key: string | undefined;

  language: string;

  overwrite: boolean;

  update: boolean;

  init: boolean;

  deploy: boolean;

  deployForce: boolean;

  updateSource: boolean;

  clientCode: boolean;

  projectGenerator: ProjectGenerator;

  namespace: string;

  constructor(options: InvokerOptions) {
    this.id = options.id
    this.key = options.key
    this.language = options.language
    this.overwrite = options.overwrite
    this.update = options.update
    this.init = options.init
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
    // if key is given, get collection from the Postman Cloud
    if (this.key && !statSync(this.id).isFile()) {
      const fetcher = new PostmanFetcher(this.key)
      if (!isGuid(collectionId)) {
        const id = await fetcher.getCollectionGuid(collectionId)
        collectionId = id
      }
      pm = await fetcher.getCollectionWithVersion(collectionId)
    } else {
      pm = read(collectionId)
    }
    if (!pm.collection) {
      console.log(`Couldn't read collection ${blue(collectionId)}`)
      throw new Error(`Couldn't read collection ${collectionId}`)
    }

    if (pm.collection && !isValid(pm.collection)) {
      console.log(`${blue(collectionId)} is not a valid Postman collection.`)
      throw new Error(`${collectionId} is not a valid Postman collection.`)
    }
    if (!pm.isVersion2X) {
      console.log(
        `${blue(
          collectionId,
        )} is not in version 2.x format of postman collection. ${green(
          'Attempting with a converted version.',
        )}`,
      )
      pm.collection = upgrade(collectionId)
    }

    collectionName = sanitizeFileName(pm.collection.name)

    if (existsSync(collectionName) && !(this.overwrite || this.update)) {
      console.log(
        `Oops! a directory named ${blue(collectionName)} already exists.`,
      )
      console.log(
        `Please move the directory or use ${blue('--overwrite')} to continue...`,
      )
      console.log(`${red("'--overwrite or -o' will delete the directory.")}`)
      throw new Error(
        `Oops! a directory named ${collectionName} already exists.`,
      )
    }
  };

  generateActions = async () => {
    async function itemGroupOps(itemsOpsArray: any) {
      for await (const item of itemsOpsArray) {
        item
      }
    }

    const validationScripts = async (
      item: any,
      actionPath: string,
      itemName: string,
    ) => {
      if (item.events && item.events.members) {
        const validations = item.events.members.filter(
          (i: any) => i.listen === 'prerequest',
        )
        if (validations.length > 0 && validations[0].script.exec) {
          const methodValidationStub = await getMethodValidationStub(
            getMethodValidations(validations[0].script.exec),
          )
          writeOrUpdateFile(
            {
              location: join(workDir, 'packages', actionPath, itemName),
              name: 'validation',
              ext: langExt,
              verbose: true,
            },
            methodValidationStub,
            this.update,
          )
          // write global validation
          const preRequest = validations[0].script.exec.join('/n')
          if (preRequest.includes('pm.globals.set')) {
            const globalValidationStub = await getGlobalValidationStub(
              getGlobalValidations(validations[0].script.exec),
            )
            writeOrUpdateFile(
              {
                location: join(workDir, 'lib'),
                name: 'validations',
                ext: langExt,
                verbose: true,
              },
              globalValidationStub,
              this.update,
            )
          }
          if (preRequest.includes('pm.environment.set')) {
            appendEnvFile(
              workDir,
              getEnvVars(undefined, validations[0].script.exec),
            )
          }
        }
      }
    }

    const testScripts = async (item: any, response: any, request: any) => {
      let testArray = item.events.members.filter(
        (i: any) => i.listen === 'test',
      )
      let testSuite
      if (!response || (response.code >= 200 && response.code < 300))
        testSuite = getSuccessSuite(request, response, pm.collection.variables)
      else testSuite = getFailureSuite()
      testSuite = testSuite.replace(/\n/g, '').split('*#!')
      if (testArray.length > 0) {
        testArray[0].script.exec = testArray[0].script.exec.concat(testSuite)
      } else {
        testArray = [{script: {exec: []}}]
        testArray[0].script.exec = testSuite
      }
    }

    const getURL = async (actionPath: string, isWebAction = false) => {
      const namespace = await this.projectGenerator.getCurrentNamespace()
      if (isWebAction)
        return `https://apigcp.nimbella.io/api/v1/web/${namespace}/${actionPath}`
      return `https://${namespace}-apigcp.nimbella.io/api/${actionPath}`
    }

    const updateURL = async (item: any, modifiedUrl: any) => {
      if (
        item.request.url.variables &&
        item.request.url.variables.members.length > 0
      ) {
        modifiedUrl += `/${item.request.url.variables.members
        .map((q: any) => `:${q.key}`)
        .join('/')}`
      }
      if (item.request.url.query && item.request.url.query.members.length > 0) {
        modifiedUrl += `?${item.request.url.query.members
        .map((q: any) => `${q.key}=${q.value}`)
        .join('&')}`
      }
      item.request.url = new URL(modifiedUrl)
      for (const res of item.responses.members) {
        res.originalRequest.url = item.request.url
      }
      return modifiedUrl
    }

    const itemOps = async (item: any) => {
      if (ItemGroup.isItemGroup(item)) {
        const itemsOpsArray = item.items.map(itemOps)
        itemGroupOps(itemsOpsArray)
        return
      }

      const actionPath = sanitizeFileName(item.parent().name as string)
      const itemName = sanitizeFileName(item.name)
      // write root level actions in project.yml
      if (actionPath === collectionName) {
        this.projectGenerator.updateProjectYML(
          workDir,
          `      - name: ${itemName}\n`,
        )
      }
      // create nimbella project
      if (!isPublicApi(item.request.url.toString())) {
        const methodStub = await getMethodStub(item)
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
        const originalUrl = item.request.url.toString()
        let modifiedUrl = originalUrl
        modifiedUrl = await getURL(`${actionPath}/${itemName}`)
        if (originalUrl !== modifiedUrl) {
          modifiedUrl = updateURL(item, modifiedUrl)
        }
      }
      const testStub = await getTestStub(item, workDir)
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

      const {request} = item
      const [response]: any = item.responses.members
      // test generation
      await validationScripts(item, actionPath, itemName)
      await testScripts(item, response, request)
      // client code generation
      if (this.clientCode) {
        try {
          const clientStub = await getClientStub(lang, langVariant, item)
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
    const itemsOpsArray = pm.collection.items.map(itemOps, undefined)
    return itemGroupOps(itemsOpsArray)
  };

  generatePackages = async (): Promise<void> => {
    workDir = this.projectGenerator.generateSkeleton({
      base: process.cwd(),
      dir: collectionName,
      collection: pm.collection,
      update: this.update,
      generator: genInstance.generator,
    })
    let actionCount = 0
    pm.collection.forEachItemGroup(async (itemGroup: any) => {
      // iteratively update project.yml
      const members = itemGroup.items.members
      if (
        members.length > 0 &&
        Object.prototype.hasOwnProperty.call(members[0], 'request')
      ) {
        const groupName = sanitizeFileName(itemGroup.name)
        this.projectGenerator.updateProjectYML(
          workDir,
          `\n  - name: ${groupName}\n    actions:\n`,
        )
        itemGroup.forEachItem(async (item: any) => {
          actionCount += 1
          if (!isPublicApi(item.request.url.toString()))
            this.projectGenerator.updateProjectYML(
              workDir,
              `      - name: ${sanitizeFileName(item.name)}\n`,
            )
        })
      }
    })

    // write header and create package for root level actions, if there are any
    if (pm.collection.items.count() > actionCount) {
      this.projectGenerator.updateProjectYML(
        workDir,
        `\n  - name: ${collectionName}\n    actions:\n`,
      )
    }
  };

  generate = async (): Promise<void> => {
    try {
      collectionId = this.id || ''
      const tasks = new Listr([
        {
          title: 'Getting Collection',
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
          title: 'Writing Updated Collection',
          task: () =>
            saveCollection(
              join(workDir, `${collectionName}.postman_collection.json`),
              pm.collection,
            ),
        },
        {
          title: 'Syncing Updated Collection to Postman Cloud',
          skip: () => {
            if (this.key && this.updateSource) {
              return false
            }
            return true
          },
          task: () =>
            new PostmanSyncer(this.key || '').updateCollection(
              collectionId,
              pm,
            ),
        },
        {
          title: 'Deploying',
          skip: () => {
            if (this.deploy) {
              return false
            }
            return true
          },
          task: async () => {
            const namespace = await this.projectGenerator.getCurrentNamespace()
            this.projectGenerator.deployProject(process.cwd(), namespace)
          },
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
  key: string | undefined;
  language: string;
  overwrite: boolean;
  deploy: boolean;
  deployForce: boolean;
  updateSource: boolean;
  clientCode: boolean;
  update: boolean;
  init: boolean;
}
