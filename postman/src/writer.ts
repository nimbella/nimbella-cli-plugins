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

import {readFileSync, writeFileSync, existsSync, appendFileSync} from 'fs'
import {convert} from 'postman-collection-transformer'
import {extname, basename, join, dirname} from 'path'
import {Collection, CollectionDefinition} from 'postman-collection'
import {blue, green} from 'chalk'
import {sync} from 'mkdirp'
import logger from './logger'
import {canBeUpdated} from './utils'

export function upgrade(fileLocation: string, version = '2.1.0'): Collection {
  const transformOptions = {
    inputVersion: '1.0.0',
    outputVersion: version,
    retainIds: true,
  }
  return convert(
    JSON.parse(readFileSync(fileLocation).toString()),
    transformOptions,
    (error: string, result: CollectionDefinition) => {
      if (error) {
        logger.error(error)
        console.log(`Couldn't convert collection: ${fileLocation}`)
      }
      const extension = extname(fileLocation)
      const fileName = `${basename(
        fileLocation,
        extension,
      )}_converted_to_v${version}.json`
      const newFileLoc = join(dirname(fileLocation), fileName)
      writeFileSync(newFileLoc, JSON.stringify(result, null, 4))
      console.log(
        `the converted version has been written at \n\t ${green(newFileLoc)}`,
      )
      return new Collection(result)
    },
  )
}

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

export function writeOrUpdateFile(
  fileMeta: FileMetaLogOption,
  content: string,
  update: boolean,
): void {
  try {
    if (!existsSync(fileMeta.location)) {
      sync(fileMeta.location)
    }
    const filePath = join(
      fileMeta.location,
      `${fileMeta.name}.${fileMeta.ext}`,
    )
    if (update) {
      if (canBeUpdated(filePath, content)) {
        writeFileSync(filePath, content)
        if (fileMeta.verbose) console.log(`${blue('updated :')} ${filePath}`)
      }
    } else {
      writeFileSync(filePath, content)
      if (fileMeta.verbose) console.log(`${blue('created :')} ${filePath}`)
    }
  } catch (error) {
    logger.error(error)
    console.log(
      `Couldn't write ${fileMeta.name}.${fileMeta.ext} at ${fileMeta.location}`,
    )
  }
}

export function appendFile(fileMeta: FileMeta, content: string): void {
  try {
    if (!existsSync(fileMeta.location)) {
      sync(fileMeta.location)
    }
    appendFileSync(
      join(fileMeta.location, `${fileMeta.name}.${fileMeta.ext}`),
      content,
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

export async function writeEnvFile(
  location: string,
  data: { key: string; value: string; description: string }[],
) {
  if (data) {
    writeFile(
      {location, name: '', ext: 'env', verbose: true},
      data
      .filter(e => e && e.key)
      .map(e => `${e.key.toUpperCase()}=${e.value} #${e.description}`)
      .join('\n'),
    )
  }
}

export async function writeReadMe(
  location: string,
  content: string,
): Promise<void> {
  writeFile({location, name: 'readme', ext: 'md', verbose: true}, content)
}

export async function appendEnvFile(
  location: string,
  data: { key: string; value: string; description: string }[],
) {
  if (data) {
    appendFileSync(
      join(location, '.env'),
      data
      .filter(e => e && e.key)
      .map(
        e =>
          `${e.key.toUpperCase()}=${e.value.trim()}${
            e.description ? ` # ${e.description}` : ''
          }`,
      )
      .join('\n'),
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
