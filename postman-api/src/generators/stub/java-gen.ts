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

import BaseGenerator from './base-gen'
import {
  sanitizeName,
  escapeSpecialChars,
  MethodStubParams,
} from '../../utils'

export default class JavaGenerator extends BaseGenerator {
  constructor() {
    super('java')
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
    const body = escapeSpecialChars(JSON.stringify(response.body || ''))
    const description = (item.request.description || '').content
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
}
