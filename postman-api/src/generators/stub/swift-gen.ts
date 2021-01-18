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

import { HeaderList } from 'postman-collection';
import BaseGenerator from './base-gen';
import {
  sanitizeName,
  escapeSpecialChars,
  MethodStubParams,
  sanitizeFileName,
  sanitizeVarName,
  isJson,
  TestStubParams,
} from '../../utils';

const TEST_STUB_RES_BODY_MAX_LEN = 300;

export default class SwiftGenerator extends BaseGenerator {
  constructor() {
    super('swift');
  }

  public getMethodStub(item: any): string {
    const path =
      item.request.url && item.request.url.path
        ? item.request.url.path.join('/')
        : '';
    const namespace = sanitizeName(item.name, '');
    let [response] = item.responses.members;
    if (!response) {
      response = '';
    }
    const code = response.code || 200;
    const headers = (response.headers || '').members;
    const cookies = (response.cookies || '').members;
    const { status } = response;
    const body = escapeSpecialChars(JSON.stringify(response.body || ''));
    const description = (item.request.description || '').content;
    const params: MethodStubParams = {
      path,
      headers,
      status,
      code,
      cookies,
      body,
      description,
      namespace,
    };
    return this.tmplMethod({
      ...params,
    });
  }

  public async getTestStub(item: any): Promise<string> {
    let [response] = item.responses.members;
    if (!response) {
      response = '';
    }
    const packageName = sanitizeFileName(item.parent().name);
    const namespace = sanitizeName(item.name, '');
    const testName = sanitizeVarName(item.name);
    const methodName = sanitizeFileName(item.name);
    const args = '';
    const expected = '';
    const got = '';
    let body = response.body || '';
    if (body.length > TEST_STUB_RES_BODY_MAX_LEN) {
      body = undefined;
    } else {
      body = JSON.stringify(body);
    }
    const testScripts: string[] = [];
    const isPostRequest: boolean = item.request.method.toLowerCase() === 'post';
    const headers: HeaderList = response.headers
      ? response.headers.members
      : [];
    const responseTime = 500;
    const propTypes: Array<object> = [];
    const propChildKeys: Array<object> = [];
    const envVars: Array<string> = (item.variables || '').members;
    const mandatoryProps: Array<string> = isJson(response.body)
      ? Object.keys(JSON.parse(response.body))
      : [];

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
    };

    return this.tmplTest({
      ...params,
    });
  }
}
