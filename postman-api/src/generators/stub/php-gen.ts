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

import { readFileSync } from 'fs';
import { Collection } from 'postman-collection';
import { join } from 'path';
import { compile } from 'handlebars';
import { SupportingItem } from '../../utils';
import BaseGenerator from './base-gen';

export default class PhpGenerator extends BaseGenerator {
  constructor() {
    super('php');
  }

  private composerStub = readFileSync(join(this.tmplPath, 'composer.hbs'));

  private tmplComposer = compile(this.composerStub.toString());

  getSupportingItems(collection: Collection): Array<SupportingItem> {
    return [
      {
        location: '.gitignore',
        content: this.tmplGitignore(collection),
      },
      {
        location: 'composer.json',
        content: this.tmplComposer(this),
      },
    ];
  }
}
