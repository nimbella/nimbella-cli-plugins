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

import {parse, validate} from '@apidevtools/swagger-parser'
import logger from './logger'

export type SpecInfo = { version: string; spec: any };

export async function read(fileLocation: string): Promise<SpecInfo> {
  try {
    const api = await parse(fileLocation)
    console.log('API name: %s, Version: %s', api.info.title, api.info.version)
    return {
      version: api.info.version,
      spec: api,
    }
  } catch (error) {
    return {version: '', spec: undefined}
  }
}

export async function isValid(spec: any): Promise<boolean> {
  try {
    const api = await validate(spec)
    logger.info('API name: %s, Version: %s', api.info.title, api.info.version)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
