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

import {readFileSync} from 'fs'
import {
  DescriptionDefinition,
  Collection,
  HeaderList,
} from 'postman-collection'
import {join} from 'path'
import {compile} from 'handlebars'
import {
  sanitizeFileName,
  SupportingItem,
  MethodStubParams,
  TestStubParams,
  isJson,
  sanitizeVarName,
  sanitizeName,
} from '../../utils'
import {getUnitTests} from '../test/test-gen'

const TEST_STUB_RES_BODY_MAX_LEN = 300

export default class BaseGenerator {
  public language: string;

  public tmplPath: string;

  public methodStub: Buffer;

  public gitignoreStub: Buffer;

  public testStub: Buffer;

  public methodValidationStub: Buffer;

  public globalValidationStub: Buffer;

  public includeFile: Buffer;

  public tmplMethod: HandlebarsTemplateDelegate<MethodStubParams>;

  public tmplTest: HandlebarsTemplateDelegate<TestStubParams>;

  public tmplGitignore: HandlebarsTemplateDelegate<Collection>;

  public tmplMethodValidation: HandlebarsTemplateDelegate<string>;

  public tmplGlobalValidation: HandlebarsTemplateDelegate<string>;

  public tmplIncludeFile: HandlebarsTemplateDelegate<string[]>;

  constructor(ext: string) {
    this.language = ext
    this.tmplPath = join(__dirname, 'templates', ext)
    this.methodStub = readFileSync(join(this.tmplPath, 'method.hbs'))
    this.gitignoreStub = readFileSync(join(this.tmplPath, 'gitignore.hbs'))
    this.testStub = readFileSync(join(this.tmplPath, 'test.hbs'))
    this.methodValidationStub = readFileSync(
      join(this.tmplPath, 'methodValidation.hbs'),
    )
    this.globalValidationStub = readFileSync(
      join(this.tmplPath, 'globalValidation.hbs'),
    )
    this.includeFile = readFileSync(join(this.tmplPath, 'include.hbs'))
    this.tmplMethod = compile(this.methodStub.toString())
    this.tmplTest = compile(this.testStub.toString())
    this.tmplGitignore = compile(this.gitignoreStub.toString())
    this.tmplMethodValidation = compile(this.methodValidationStub.toString())
    this.tmplGlobalValidation = compile(this.globalValidationStub.toString())
    this.tmplIncludeFile = compile(this.includeFile.toString())
  }

  public getMethodStub(item: any): string {
    const path =
      item.request.url && item.request.url.path ?
        item.request.url.path.join('/') :
        ''
    const namespace = sanitizeName(item.name, '')
    let [response] = item.responses.members
    if (!response) {
      response = ''
    }
    const code = response.code || 200
    const headers = (response.headers || '').members
    const cookies = (response.cookies || '').members
    const {status} = response
    const body = response.body || ''
    const description = ((item.request.description ||
      '') as DescriptionDefinition).content
    const params: MethodStubParams = {
      path,
      headers,
      status,
      code,
      cookies,
      body,
      description,
      namespace,
    }
    return this.tmplMethod({
      ...params,
    })
  }

  public async getTestStub(item: any, location: string): Promise<string> {
    let [response] = item.responses.members
    if (!response) {
      response = ''
    }
    const packageName = sanitizeFileName(item.parent().name)
    const namespace = sanitizeName(item.name, '')
    const testName = sanitizeVarName(item.name)
    const methodName = sanitizeFileName(item.name)
    const args = ''
    const expected = ''
    const got = ''
    let body = response.body || ''
    if (body.length > TEST_STUB_RES_BODY_MAX_LEN) {
      body = undefined
    } else {
      body = JSON.stringify(body)
    }
    const testScripts: string[] = await getUnitTests(
      item,
      location,
      packageName,
      methodName,
    )
    const isPostRequest: boolean = item.request.method.toLowerCase() === 'post'
    const headers: HeaderList = response.headers ?
      response.headers.members :
      []
    const responseTime = 500
    const propTypes: Array<object> = []
    const propChildKeys: Array<object> = []
    const envVars: Array<string> = (item.variables || '').members
    const mandatoryProps: Array<string> = isJson(response.body) ?
      Object.keys(JSON.parse(response.body)) :
      []

    const params: TestStubParams = {
      testName,
      packageName,
      methodName,
      args,
      expected,
      got,
      body,
      testScripts,
      isPostRequest,
      headers,
      responseTime,
      propTypes,
      propChildKeys,
      envVars,
      mandatoryProps,
      namespace,
    }

    return this.tmplTest({
      ...params,
    })
  }

  public getMethodValidationStub(item: any): string {
    return this.tmplMethodValidation(item)
  }

  public getGlobalValidationStub(item: any): string {
    return this.tmplGlobalValidation(item)
  }

  public getIncludeFile(files: string[]): SupportingItem {
    return {
      location: '.include',
      content: this.tmplIncludeFile(files),
    }
  }

  public getSupportingItems(collection: Collection): Array<SupportingItem> {
    return [
      {
        location: '.gitignore',
        content: this.tmplGitignore(collection),
      },
    ]
  }
}
