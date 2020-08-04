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
import {blue} from 'chalk'
import logger from './logger'

export class Utils {
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
    return this.currentNamespace.replace('\n', '')
  }

  sanitizeName(name: string, joiner: string) {
    let newName = ''
    newName = name
    .replace(/[^a-zA-Z0-9]/g, joiner)
    .replace(/-{2,}/g, joiner)
    .toLowerCase()
    if (joiner && newName.endsWith(joiner)) newName = newName.slice(0, -1)
    return newName
  }

  isJson(item: any) {
    item = typeof item === 'string' ? item : JSON.stringify(item)

    try {
      item = JSON.parse(item)
    } catch (error) {
      return false
    }

    if (typeof item === 'object' && item !== null) {
      return true
    }

    return false
  }

  toTitleCase = (phrase: string) =>
    phrase
    .toLowerCase()
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
