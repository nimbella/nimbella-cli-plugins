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

import {HeaderList} from 'postman-collection'
import {createHash, HexBase64Latin1Encoding} from 'crypto'
import {readFileSync, statSync} from 'fs'
import {urls} from './public-apis'
import logger from './logger'

export function sanitizeName(name: string, joiner: string) {
  let newName = ''
  newName = name
  .replace(/[^a-zA-Z0-9]/g, joiner)
  .replace(/-{2,}/g, joiner)
  .toLowerCase()
  if (joiner && newName.endsWith(joiner)) newName = newName.slice(0, -1)
  return newName
}

export function sanitizeFileName(name: string): string {
  return sanitizeName(name, '-')
}

export function sanitizeVarName(name: string): string {
  return sanitizeName(name, '_')
}

export interface SupportingItem {
  location: string;
  content: string;
}

export type MethodStubParams = {
  path: string;
  headers: any;
  status: string;
  code: number;
  cookies: any;
  body: string;
  description: string;
  namespace: string;
};

export type TestStubParams = {
  testName: string;
  packageName: string;
  methodName: string;
  args: string;
  expected: string;
  got: string;
  body: string;
  testScripts: Array<string>;
  isPostRequest: boolean;
  headers: HeaderList;
  responseTime: number;
  propTypes: Array<object>;
  propChildKeys: Array<object>;
  envVars: Array<string>;
  mandatoryProps: Array<string>;
  namespace: string;
};

export function isJson(item: any) {
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

export function isGuid(uid: string) {
  if (uid[0] === '{') {
    uid = uid.substring(1, uid.length - 1)
  }
  const regexGuid = /^(\{){0,1}[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\}){0,1}$/gi
  return regexGuid.test(uid)
}

export function escapeSpecialChars(data: string) {
  return data
  .replace(/\\n/g, '\\n')
  .replace(/\\'/g, "\\'")
  .replace(/\\"/g, '\\"')
  .replace(/\\&/g, '\\&')
  .replace(/\\r/g, '\\r')
  .replace(/\\t/g, '\\t')
  .replace(/\\b/g, '\\b')
  .replace(/\\f/g, '\\f')
}

export function stringChecksum(
  str: string,
  algorithm = 'md5',
  encoding: HexBase64Latin1Encoding = 'hex',
) {
  const length = str.length
  const hash = createHash(algorithm).update(str, 'utf8').digest(encoding)
  return {length, hash}
}

export function fileChecksum(location: string) {
  let data: any = ''
  try {
    data = readFileSync(location)
  } catch (error) {
    logger.error(error)
  }
  return exports.stringChecksum(data)
}

export function canBeUpdated(
  fileLocation: string,
  generatedText: string,
): boolean {
  try {
    const fileText = fileChecksum(fileLocation)
    const genText = stringChecksum(generatedText)
    return fileText.length < genText.length
  } catch (error) {
    console.log(error)
    return false
  }
}

export function isFile(path: string) {
  try {
    return statSync(path).isFile()
  } catch (error) {
    return false
  }
}

export function isPublicApi(url: string) {
  return url in urls
}
