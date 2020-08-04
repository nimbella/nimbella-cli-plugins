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

import {writeFileSync, existsSync, appendFileSync, unlinkSync} from 'fs'
import {join} from 'path'
import {blue, green} from 'chalk'
import {sync} from 'mkdirp'
import logger from './logger'

export async function saveCollection(
  location: string,
  data: object,
): Promise<boolean> {
  try {
    writeFileSync(location, JSON.stringify(data, null, 4))
    console.log(
      `collection with updated endpoints and tests, has been written at \n\t ${green(
        location,
      )}`,
    )
    return true
  } catch (error) {
    logger.error(error)
    console.log(`Couldn't save collection at: ${location}`)
    return false
  }
}

export function writeFile(fileMeta: FileMetaLogOption, content: string): void {
  try {
    if (!existsSync(fileMeta.location)) {
      sync(fileMeta.location)
    }
    writeFileSync(
      join(fileMeta.location, `${fileMeta.name}.${fileMeta.ext}`),
      content,
    )
    if (fileMeta.verbose)
      console.log(
        `${blue('created :')}  ${fileMeta.location}/${fileMeta.name}.${
          fileMeta.ext
        }`,
      )
  } catch (error) {
    logger.error(error)
    console.log(
      `Couldn't create ${fileMeta.name}.${fileMeta.ext} at ${fileMeta.location}`,
    )
  }
}

export function appendFile(fileMeta: FileMetaContent): void {
  try {
    if (!existsSync(fileMeta.location)) {
      sync(fileMeta.location)
    }
    appendFileSync(
      join(fileMeta.location, `${fileMeta.name}.${fileMeta.ext}`),
      fileMeta.content,
    )
    console.log(
      `${blue('updated :')}  ${fileMeta.location}/${fileMeta.name}.${
        fileMeta.ext
      }`,
    )
  } catch (error) {
    logger.error(error)
    console.log(
      `Couldn't update ${fileMeta.name}.${fileMeta.ext} at ${fileMeta.location}`,
    )
  }
}

export function deleteFile(fileMeta: FileMetaLogOption): void {
  try {
    unlinkSync(join(fileMeta.location, `${fileMeta.name}.${fileMeta.ext}`))
    if (fileMeta.verbose)
      console.log(
        `${blue('deleted :')}  ${fileMeta.location}/${fileMeta.name}.${
          fileMeta.ext
        }`,
      )
  } catch (error) {
    logger.error(error)
    console.log(
      `Couldn't delete ${fileMeta.name}.${fileMeta.ext} at ${fileMeta.location}`,
    )
  }
}
export interface FileMeta {
  location: string;
  name: string;
  ext: string;
}
export interface FileMetaContent extends FileMeta {
  content: string;
}

export interface FileMetaLogOption extends FileMeta {
  verbose: boolean;
}
