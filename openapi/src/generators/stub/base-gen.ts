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
import {join} from 'path'
import {compile, registerHelper} from 'handlebars'
import {
  sanitizeFileName,
  SupportingItem,
  MethodStubParams,
  TestStubParams,
  isJson,
  sanitizeVarName,
} from '../../utils'

const helpers = require('handlebars-helpers')(['comparison'])
registerHelper(helpers)
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

  public tmplGitignore: HandlebarsTemplateDelegate<any>;

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
    const path = ''
    const namespace = item.operationId
    const response = Object.entries(item.responses)[0]
    const code: any = response[0] || 200
    const props: any = response[1]
    const headers = props.headers || ''
    const cookies = props.cookies || ''
    const {status} = props.description
    const body = props.schema || ''
    const description = (item.requestBody || '').description
    const params: MethodStubParams = {
      path,
      headers,
      status,
      code,
      cookies,
      body,
      description,
      namespace,
      responses: item.responses,
    }
    return this.tmplMethod({
      ...params,
    })
  }

  public getTestStub(
    item: any,
    location: string,
    actionMethod: string,
  ): string {
    const responses = Object.entries(item.responses)
    const response = responses[0]
    const props: any = response[1]
    const packageName = sanitizeFileName(item.tags[0])
    const namespace = item.operationId
    const testName = sanitizeVarName(item.operationId)
    const methodName = sanitizeFileName(item.operationId)
    const args = ''
    const expected = ''
    const got = ''
    let body = props.schema || ''
    if (body.length > TEST_STUB_RES_BODY_MAX_LEN) {
      body = undefined
    } else {
      body = JSON.stringify(body)
    }
    const isPostRequest: boolean = actionMethod.toLowerCase() === 'post'
    const headers: any = props.headers ? props.headers : []
    const responseTime = 500
    const propTypes: Array<object> = []
    const propChildKeys: Array<object> = []
    const envVars: Array<string> = item.variables || ''
    const mandatoryProps: Array<string> = isJson(props.schema) ?
      Object.keys(JSON.parse(props.schema)) :
      []

    const params: TestStubParams = {
      testName,
      packageName,
      methodName,
      args,
      expected,
      got,
      body,
      isPostRequest,
      headers,
      responseTime,
      propTypes,
      propChildKeys,
      envVars,
      mandatoryProps,
      namespace,
      responses: item.responses,
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

  public getSupportingItems(collection: any): Array<SupportingItem> {
    return [
      {
        location: '.gitignore',
        content: this.tmplGitignore(collection),
      },
    ]
  }
}
