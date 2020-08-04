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

import {readdirSync, statSync} from 'fs'
import {join, sep, extname, basename} from 'path'

const isDirectory = (path: string) => statSync(path).isDirectory()
const isNotEmpty = (path: string) => readdirSync(path).length > 0
const getDirectories = (path: string) =>
  readdirSync(path)
  .map(name => join(path, name))
  .filter(isDirectory)
  .filter(isNotEmpty)

const isFile = (path: string) => statSync(path).isFile()
const getFiles = (path: string) =>
  readdirSync(path)
  .map(name => join(path, name))
  .filter(isFile)

const getRunTime = (ext: string) => {
  let runtime = ''
  const kind = 'default'
  switch (ext) {
  case '.js':
    runtime = 'nodejs'
    break
  case '.ts':
    runtime = 'typescript'
    break
  case '.py':
    runtime = 'python'
    break
  case '.go':
    runtime = 'go'
    break
  case '.swift':
    runtime = 'swift'
    break
  case '.php':
    runtime = 'php'
    break
  case '.java':
    runtime = 'java'
    break
  default:
    break
  }
  return `${runtime}:${kind}`
}
export function read(location: string): any[] {
  const packages: any[] = []
  try {
    getDirectories(join(location, 'packages')).forEach(packageDir => {
      const name = packageDir.split(sep).pop()
      const group = {
        name: name,
        actions: [{}],
        escapedName: name?.replace(/-/g, '_'),
      }
      getDirectories(packageDir).forEach(actionDir => {
        const files = getFiles(actionDir)
        let mainFile = files.filter(f => {
          const fileName = basename(f)
          return fileName.startsWith('index') || fileName.startsWith('main')
        })
        if (mainFile.length > 0) {
          mainFile = files.filter(
            fn =>
              fn.endsWith('.js') ||
              fn.endsWith('.ts') ||
              fn.endsWith('.java') ||
              fn.endsWith('.py') ||
              fn.endsWith('.go') ||
              fn.endsWith('.php') ||
              fn.endsWith('.swift'),
          )
        }
        const ext = extname(mainFile[0])
        const runtime = getRunTime(ext)
        const name = actionDir.split(sep).pop()
        group.actions.push({
          name: name,
          runtime: runtime,
          escapedName: name?.replace(/-/g, '_'),
        })
      })
      getFiles(packageDir).forEach(action => {
        const ext = extname(action)
        const runtime = getRunTime(ext)
        const name = basename(action, ext)
        group.actions.push({
          name: name,
          runtime: runtime,
          escapedName: name?.replace(/-/g, '_'),
        })
      })
      group.actions.shift()
      packages.push(group)
    })
  } catch (error) {
    console.log(error)
  }
  return packages
}
