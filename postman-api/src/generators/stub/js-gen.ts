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
import { join } from 'path';
import { compile } from 'handlebars';
import { sanitizeFileName, SupportingItem } from '../../utils';
import BaseGenerator from './base-gen';

export default class JsGenerator extends BaseGenerator {
  constructor() {
    super('js');
  }

  private eslintStub = readFileSync(join(this.tmplPath, 'eslint.hbs'));

  private tmplEslint = compile(this.eslintStub.toString());

  private packageStub = readFileSync(join(this.tmplPath, 'package.hbs'));

  private tmplPackage = compile(this.packageStub.toString());

  getSupportingItems(collection: any): Array<SupportingItem> {
    const name = sanitizeFileName(collection.name || '');
    const desc = (collection.description || '').content;
    const re = new RegExp(/^(.*?)[.?!]\s/);
    const shortDesc = re.exec(desc);
    const params = {
      name,
      description: shortDesc ? shortDesc[0] : '',
    };
    return [
      {
        location: '.gitignore',
        content: this.tmplGitignore(collection),
      },
      {
        location: '.eslintrc.json',
        content: this.tmplEslint(this),
      },
      {
        location: 'package.json',
        content: this.tmplPackage({
          ...params,
        }),
      },
    ];
  }
}
