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

import { join } from 'path'
import { readFileSync } from 'fs'
import {compile} from 'handlebars'
import { generateOpenAPI3 } from '@airtasker/spot/build/lib/src/generators/openapi3/openapi3'
import { parseContract } from '@airtasker/spot/build/lib/src/parsers/contract-parser'
import { createProjectFromExistingSourceFile } from '@airtasker/spot/build/lib/src/spec-helpers/helper'
import { writeFile, deleteFile } from '../writer'

const templateFile = readFileSync(join(__dirname, 'templates', 'spot.ts.hbs'))
const template = compile(templateFile.toString())

export async function getOpenApiSpec(meta: any): Promise<string> {
  const spec = template({
    ...meta,
  })
  writeFile({ location: meta.cwd, name: meta.name, ext: 'ts', verbose: false }, spec)
  const specFile = createProjectFromExistingSourceFile(
    join(meta.cwd, `${meta.name}.ts`),
  ).file
  const { contract } = parseContract(specFile).unwrapOrThrow()
  const openAPI3 = generateOpenAPI3(contract)
  deleteFile({ location: meta.cwd, name: meta.name, ext: 'ts', verbose: false })
  return JSON.stringify(openAPI3, null, 2)
}

export async function writeOpenApiSpec(meta: any): Promise<void> {
  const openAPI3 = await getOpenApiSpec(meta)
  writeFile({ location: meta.cwd, name: `${meta.name}.${meta.spec}`, verbose: false, ext: 'json' }, openAPI3)
}
