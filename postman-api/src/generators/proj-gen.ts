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

import {sync} from 'mkdirp'
import * as rimraf from 'rimraf'
import * as ncp from 'ncp'
import {existsSync, writeFileSync, appendFileSync} from 'fs'
import {join} from 'path'
import {Collection} from 'postman-collection'
import {blue} from 'chalk'
import {getReadMe} from './stub/common-gen'
import BaseGenerator from './stub/base-gen'
import logger from '../logger'
import {writeEnvFile, writeReadMe} from '../writer'
import {getEnvVars} from './test/test-gen'
export default class ProjectGenerator {
  currentNamespace: string | undefined;

  async createDir(base: string, dir: string, verbose = true): Promise<void> {
    const loc = join(base, dir)
    try {
      sync(loc)
      if (verbose) console.log(`${blue('created :')}  ${loc}`)
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't create directory : ${loc}`)
    }
  }

  createProjectYML(base: string): void {
    try {
      writeFileSync(`${base}/project.yml`, 'packages:')
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't create project.yml at ${base}`)
    }
  }

  updateProjectYML(base: string, content: string): void {
    try {
      appendFileSync(`${base}/project.yml`, content)
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't update project.yml at ${base}`)
    }
  }

  generateSkeleton(opts: ProjectSkeletonOptions): string {
    const workDir = join(opts.base, opts.dir)
    if (!opts.update) {
      if (existsSync(workDir)) {
        rimraf.sync(workDir)
      }
      this.createDir(opts.base, opts.dir)
      this.createDir(workDir, 'packages')
      const templatePath = join(__dirname, 'stub', 'templates', 'common')
      ncp.ncp(templatePath, workDir, err => {
        if (err) {
          logger.error(err)
          console.log("Couldn't copy the   content")
        }
      })
    }
    this.createProjectYML(workDir)
    opts.generator
    .getSupportingItems(opts.collection)
    .forEach((item: { location: string; content: string }) => {
      writeFileSync(join(workDir, item.location), item.content)
    })
    writeReadMe(
      workDir,
      getReadMe(((opts.collection as any).description || '').content),
    )
    writeEnvFile(workDir, getEnvVars(opts.collection, undefined))
    return workDir
  }
}
export interface RouteOptions {
  path: string;
  relPath: string;
  name: string;
  method: string;
  responseType: string;
}

export interface ProjectSkeletonOptions {
  base: string;
  dir: string;
  collection: Collection;
  update: boolean;
  generator: BaseGenerator;
}
