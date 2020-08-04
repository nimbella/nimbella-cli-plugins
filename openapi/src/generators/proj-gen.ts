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

import {which, exec} from 'shelljs'
import {sync} from 'mkdirp'
import * as rimraf from 'rimraf'
import * as ncp from 'ncp'
import {existsSync, writeFileSync, appendFileSync} from 'fs'
import {join} from 'path'
import {blue, greenBright} from 'chalk'
import getReadMe from './stub/common-gen'
import BaseGenerator from './stub/base-gen'
import logger from '../logger'
import {writeReadMe} from '../writer'
export default class ProjectGenerator {
  currentNamespace: string | undefined;

  isAvailable(): boolean {
    if (which('nim')) {
      return true
    }
    return false
  }

  async execShellCommand(cmd: string, verbose = false): Promise<string> {
    if (verbose) {
      console.log(`${blue('running :')} ${cmd}`)
    }
    try {
      const execution = exec(cmd, {silent: !verbose})
      if (execution.code !== 0) {
        logger.error(execution.stderr)
      }
      return execution.stdout
    } catch (error) {
      logger.error(error)
      console.log(`Couldn't execute: ${cmd}`)
      return error
    }
  }

  getCurrentNamespace(): string {
    if (!this.currentNamespace) {
      const cmd = 'nim auth current'
      try {
        const execution = exec(cmd, {silent: true})
        if (execution.code !== 0) {
          logger.error(execution.stderr)
        }
        this.currentNamespace = execution.stdout
      } catch (error) {
        logger.error(error)
        console.log(`Couldn't execute: ${cmd}`)
        return error
      }
    }
    return this.currentNamespace
  }

  async getActionUrl(name: string): Promise<string> {
    const cmd = `nim action get ${name} -r`
    return this.execShellCommand(cmd)
  }

  async createRoute(opts: RouteOptions): Promise<string> {
    const cmd = `nim route create /${opts.path}  /${opts.relPath} ${opts.method} ${opts.name} --response-type ${opts.responseType}`
    return this.execShellCommand(cmd)
  }

  async createWebAction(name: string, codeFile: string): Promise<string> {
    const cmd = `nim action create ${name} ${codeFile} --web true`
    this.execShellCommand(cmd)
    const actionUrl = await this.getActionUrl(name)
    console.log(`action created:\n  ${greenBright(actionUrl)}`)
    return actionUrl
  }

  async updateWebAction(name: string, codeFile: string): Promise<string> {
    const cmd = `nim action update ${name} ${codeFile} --web true`
    this.execShellCommand(cmd)
    const actionUrl = await this.getActionUrl(name)
    console.log(`action updated:\n  ${greenBright(actionUrl)}`)
    return actionUrl
  }

  async createPackage(packageName: string): Promise<void> {
    const cmd = `nim package create ${packageName}`
    this.execShellCommand(cmd)
  }

  async deployProject(projectPath: string, namespace: string): Promise<void> {
    const cmd = `nim project deploy ${projectPath} --target ${namespace}`
    this.execShellCommand(cmd)
  }

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
    .getSupportingItems(opts.spec)
    .forEach((item: { location: string; content: string }) => {
      writeFileSync(join(workDir, item.location), item.content)
    })
    writeReadMe(workDir, getReadMe(opts.spec.info.description || ''))
    // writeEnvFile(workDir, getEnvVars(collection, undefined));
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
  spec: any;
  update: boolean;
  generator: BaseGenerator;
}
