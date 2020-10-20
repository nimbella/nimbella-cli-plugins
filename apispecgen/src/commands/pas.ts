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

import {Command, flags} from '@oclif/command'
import {prompt} from 'inquirer'
import Generator from '../invoker'
import logger from '../logger'

const supportedFormats = ['postman', 'openapi', 'nimbella']
/*
JsonAPI,
Postman,
GraphQL,
OData,
RAML,
gRPC,
REST,
Amazon API,
Insomnia REST,
Paw,
Runscope,
Apigee,
OpenAPI Specification,
Soap UI,
Retrofit,
Charles,
Swagger Codegen,
JSON Server
*/

export default class ApiSpec extends Command {
  static description = 'Generates API Specifications for a Nimbella Project';

  static examples = [
    `$ nim project pas postman
Generating Postman API Specifications!
`,
  ];

  static hidden = true;
  static strict = false;
  static flags = {
    overwrite: flags.boolean({
      char: 'o',
      description:
        'Overwrites the existing nimbella project directory if it exists',
      default: false,
    }),
    
    type: flags.string({
        char: 't',
        description: 'Target API Specification Format',
        options: supportedFormats,
    }),
  };

 

  async run() {
    const {flags} = this.parse(ApiSpec)
    let {overwrite, type} = flags

    if (!type) {
      const params: PromptParams = {
        type: 'list',
        message: 'Target API Specification Format',
        choices: supportedFormats,
        source: undefined,
        default: 'nimbella',
      }
      type = await this.getValue(params)
    }
    if (!overwrite) {
      const params: PromptParams = {
        type: 'confirm',
        message: 'Overwrite existing doc if exists',
        choices: [],
        source: undefined,
        default: false,
      }
      overwrite = await this.getValue(params)
    }
    new Generator(type, overwrite).generate().catch((error: string) => {
      console.log('Oops! Some Error Occurred, Please Try Again')
      logger.error(error)
    })
  }

  private async getValue(promptParams: PromptParams) {
    const value = await prompt<{
      val: any;
    }>({
      name: 'val',
      ...promptParams,
    })
    return value.val
  }
}
interface PromptParams {
  type: any;
  message: string;
  choices: string[] | undefined;
  source: any;
  default: any;
}
