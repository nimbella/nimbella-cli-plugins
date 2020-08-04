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

import {join} from 'path'
import {readFileSync} from 'fs'
import {isJson} from '../../utils'
import Handlebars = require('handlebars');

const successSuite = readFileSync(join(__dirname, 'templates', 'success.hbs'))
const successTmpl = Handlebars.compile(successSuite.toString())

const failureSuite = readFileSync(join(__dirname, 'templates', 'fail.hbs'))
const failureTmpl = Handlebars.compile(failureSuite.toString())

export function getSuccessSuite(
  request: any,
  response: any | undefined,
  variables: any,
): string {
  const isPostRequest: boolean = request.method.toLowerCase() === 'post'
  const responseTime = 500
  const propTypes: Array<object> = []
  const propChildKeys: Array<object> = []
  const envVars: Array<string> = variables.members
  const headers: any = response ? response.headers.members : []
  const mandatoryProps: Array<string> =
    response && isJson(response.body) ?
      Object.keys(JSON.parse(response.body)) :
      []
  const res = successTmpl({
    isPostRequest,
    headers,
    responseTime,
    propTypes,
    propChildKeys,
    envVars,
    mandatoryProps,
  })
  return res
}

export function getFailureSuite(): string {
  const res = failureTmpl({})
  return res
}
