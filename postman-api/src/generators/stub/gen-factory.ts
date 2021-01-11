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

import GeneratorInfo from './gen-info'
import BaseGenerator from './base-gen'
import JsGenerator from './js-gen'
import PhpGenerator from './php-gen'
import JavaGenerator from './java-gen'
import PyGenerator from './py-gen'
import SwiftGenerator from './swift-gen'
import TsGenerator from './ts-gen'

let ext: string
let variant: string
let generator: BaseGenerator

export default function init(language: string): GeneratorInfo {
  switch (language) {
  case 'go':
    variant = 'Native'
    ext = 'go'
    generator = new BaseGenerator(ext)
    break
  case 'java':
    variant = 'OkHttp'
    ext = 'java'
    generator = new JavaGenerator()
    break
  case 'php':
    variant = 'cURL'
    ext = 'php'
    generator = new PhpGenerator()
    break
  case 'py':
    variant = 'http.client'
    ext = 'py'
    generator = new PyGenerator()
    break
  case 'swift':
    variant = 'URLSession'
    ext = 'swift'
    generator = new SwiftGenerator()
    break
  case 'ts':
    variant = 'Request'
    ext = 'ts'
    generator = new TsGenerator()
    break
  default:
    variant = 'Request'
    ext = 'js'
    generator = new JsGenerator()
    break
  }
  return new GeneratorInfo(variant, ext, generator)
}
