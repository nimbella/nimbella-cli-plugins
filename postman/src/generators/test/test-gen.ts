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
import {HeaderList} from 'postman-collection'
import {Parser} from 'acorn'
import {print} from 'recast'
import {isJson} from '../../utils'
import {writeFile} from '../../writer'
import {getIncludeFile} from '../stub/stub-gen'
import logger from '../../logger'
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
  const headers: HeaderList = response ? response.headers.members : []
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

export function getEnvVars(
  collection: any | undefined = undefined,
  scripts: string[] | undefined = undefined,
): { key: string; value: string; description: string }[] {
  const envVars: { key: string; value: string; description: string }[] = []
  if (collection) {
    collection.variables.members.forEach((e: any) => {
      envVars.push(e.key, e.value, e.description)
    })
  }
  if (scripts && scripts.length > 0) {
    scripts
    .filter((s: string) => s.startsWith('pm.environment.set('))
    .forEach((e: string) => {
      const kv = e
      .replace(/"/g, '')
      .replace('pm.environment.set(', '')
      .replace(');', '')
      .split(',')
      envVars.push({key: kv[0], value: kv[1], description: ''})
    })
  }
  return envVars
}

export function pmToEnvVars(script: string) {
  return script
  .replace(/['")]/g, '')
  .replace('pm.environment.', 'process.env.')
  .replace('postman.setEnvironmentVariable(', 'process.env.')
  .replace(',', '=')
  .replace('get(', '')
  .replace('set(', '')
  .replace(/process.env.\b\w+\b/g, l => l.toUpperCase())
  .replace('PROCESS.ENV', 'process.env')
  .replace('globals.get', 'console.log')
}

function extractFunctionBody(scripts: string[]) {
  const ast: any = Parser.parse(scripts.join('\n'))
  let outScript = ''
  try {
    scripts
    .filter((s: string) => s.startsWith('pm.globals.set('))
    .forEach((e: string) => {
      const name = e
      .replace('"', '')
      .replace(/'/g, '')
      .replace('pm.globals.set(', '')
      .split(',')[0]
      ast.body
      .filter((s: any) => s.type === 'FunctionDeclaration')
      .forEach((element: any) => {
        if (element.id.name === name) {
          outScript += print(element).code
        }
      })
    })
  } catch (error) {
    logger.error(error)
  }
  return outScript
}

export function getMethodValidations(scripts: string[] = []): string[] {
  const globalTests = scripts.filter((s: string) =>
    s.includes('pm.globals.set('),
  )
  let tests = scripts.filter((s: string) => !s.includes('pm.globals.set('))
  if (globalTests.length > 0) {
    const consolidatedScript = scripts.join('\n')
    const globalFunc = extractFunctionBody(scripts)
    tests = consolidatedScript.replace(globalFunc, '').split('\n')
  }
  tests.forEach((s: string, i, a) => {
    if (s.includes('pm.environment.toObject()')) {
      a[i] = a[i].replace(/pm.environment.toObject()/g, 'process.env')
    }
    if (
      a[i].includes('pm.environment.') ||
      a[i].includes('postman.setEnvironmentVariable.')
    ) {
      a[i] = pmToEnvVars(a[i])
    }
    if (a[i].includes('pm.variables.')) {
      a[i] = a[i].replace(/pm.variables/g, 'nimbella.redis()')
    }
  })
  return tests
}

export function getGlobalValidations(scripts: string[]): string {
  const script = extractFunctionBody(scripts)
  const outScriptArray = script.split('\n')
  outScriptArray.forEach((e: string, i: number, a: any) => {
    if (
      a[i].includes('pm.environment.') ||
      a[i].includes('postman.setEnvironmentVariable.')
    ) {
      a[i] = pmToEnvVars(e)
    }
  })
  return outScriptArray.join('\n')
}

export async function getUnitTests(
  item: any,
  location: string,
  packageName: string,
  actionName: string,
): Promise<string[]> {
  const tests = item.events.members.filter((i: any) => i.listen === 'test')
  if (tests.length > 0) {
    const scripts = tests[0].script.exec || []
    scripts.forEach(async (e: string, i: number, a: any) => {
      if (a[i].includes('pm.environment.toObject()')) {
        a[i] = a[i].replace(/pm.environment.toObject()/g, 'process.env')
      }
      if (a[i].includes('globals.get')) {
        const includeScript = await getIncludeFile(['validations'])
        writeFile(
          {
            location: join(location, 'packages', packageName, actionName),
            name: '',
            ext: 'include',
            verbose: true,
          },
          includeScript.content,
        )
      }
      if (
        a[i].includes('pm.environment.') ||
        a[i].includes('postman.setEnvironmentVariable.')
      ) {
        a[i] = pmToEnvVars(a[i])
      }
      if (a[i].includes('pm.variables.')) {
        a[i] = a[i].replace(/pm.variables/g, 'nimbella.redis()')
      }
      a[i] = a[i]
      .replace(/pm./g, '')
      .replace(/postman./g, '')
      .replace('setNextRequest', 'console.log')
      .replace('stopWorkflow', 'console.log')
      .replace('globals.get', 'console.log')
    })
    return scripts
  }
  return []
}
