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

import init from './gen-factory';
import GeneratorInfo from './gen-info';
import { SupportingItem } from '../../utils';

let genInstance: GeneratorInfo;

export async function getMethodStub(item: any): Promise<string> {
  return genInstance.generator.getMethodStub(item);
}

export async function getTestStub(
  item: any,
  location: string
): Promise<string> {
  return genInstance.generator.getTestStub(item, location);
}

export async function getGlobalValidationStub(item: any): Promise<string> {
  return genInstance.generator.getGlobalValidationStub(item);
}

export async function getMethodValidationStub(item: any): Promise<string> {
  return genInstance.generator.getMethodValidationStub(item);
}

export async function getIncludeFile(item: any): Promise<SupportingItem> {
  return genInstance.generator.getIncludeFile(item);
}

export function getInstance(language: string): GeneratorInfo {
  genInstance = init(language);
  return genInstance;
}
