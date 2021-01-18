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

export type CollectionInfo = { isVersion2X: boolean; collection: Collection };

export function read(fileLocation: string): CollectionInfo {
  try {
    const collection = JSON.parse(readFileSync(fileLocation).toString());
    return {
      isVersion2X: ((collection.info || '').schema || '').includes('v2'),
      collection: new Collection(collection),
    };
  } catch (error) {
    return { isVersion2X: false, collection: new Collection() };
  }
}

export function isValid(collection: Collection): boolean {
  return Collection.isCollection(collection);
}
