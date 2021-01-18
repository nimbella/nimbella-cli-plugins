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

import { join } from 'path';
import { readFileSync } from 'fs';
import Handlebars = require('handlebars');

const templateReadMeFile = readFileSync(
  join(__dirname, '..', 'stub', 'templates', 'readme.hbs')
);
const templateReadMe = Handlebars.compile(templateReadMeFile.toString());

const templateCollectionDocFile = readFileSync(
  join(__dirname, '..', 'stub', 'templates', 'collection.hbs')
);
const templateCollectionDoc = Handlebars.compile(
  templateCollectionDocFile.toString()
);

export function getReadMe(description: string): string {
  return templateReadMe({
    description,
  });
}

export function getCollectionDoc(meta: object): string {
  return templateCollectionDoc(meta);
}
